import { PrismaClient } from "@prisma/client";
import { CryptoUtils } from "./crypto.utils";
import { PaystackService } from "./paystack.service";

export interface CenterBalance {
  centerId: string;
  centerName?: string;
  eligibleAmount: number;
  eligibleTransactions: any[];
  totalPaidOut: number;
  transactionCount: number;
  pendingPayouts: number;
  lastPayoutDate?: Date;
}

export interface CreateManualPayoutParams {
  centerId: string;
  amount: number;
  transactionIds: string[];
  initiatedBy: string;
  reason?: string;
}

export interface MonthlyPayoutResult {
  processed: number;
  failed: number;
  totalAmount: number;
  details: Array<{
    centerId: string;
    centerName: string;
    status: string;
    amount: number;
    error?: string;
  }>;
}

export class PayoutService {
  constructor(
    private prisma: PrismaClient,
    private paystackService: PaystackService
  ) {}

  /**
   * Get center balance and eligible transactions
   */
  async getCenterBalance(centerId: string): Promise<CenterBalance> {
    const center = await this.prisma.serviceCenter.findUnique({
      where: { id: centerId },
      select: { centerName: true },
    });

    // Get completed transactions that haven't been paid out
    const eligibleTransactions = await this.prisma.transaction.findMany({
      where: {
        status: "COMPLETED",
        payoutItem: null, // Not yet included in any payout
        appointments: {
          some: {
            centerId: centerId,
          },
        },
      },
      include: {
        appointments: {
          include: {
            center: { select: { centerName: true } },
            patient: { select: { fullName: true } },
            screeningType: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalEligible = eligibleTransactions.reduce(
      (sum, tx) => sum + Number(tx.amount),
      0
    );

    // Get previous payouts total
    const totalPaidOut = await this.prisma.payout.aggregate({
      _sum: { amount: true },
      where: {
        centerId,
        status: { in: ["SUCCESS", "PROCESSING"] },
      },
    });

    // Get pending payouts
    const pendingPayouts = await this.prisma.payout.aggregate({
      _sum: { amount: true },
      where: {
        centerId,
        status: "PENDING",
      },
    });

    // Get last payout date
    const lastPayout = await this.prisma.payout.findFirst({
      where: {
        centerId,
        status: "SUCCESS",
      },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true },
    });

    return {
      centerId,
      centerName: center?.centerName,
      eligibleAmount: totalEligible,
      eligibleTransactions,
      totalPaidOut: Number(totalPaidOut._sum.amount) || 0,
      pendingPayouts: Number(pendingPayouts._sum.amount) || 0,
      transactionCount: eligibleTransactions.length,
      lastPayoutDate: lastPayout?.completedAt || undefined,
    };
  }

  /**
   * Get all center balances
   */
  async getAllCenterBalances(): Promise<CenterBalance[]> {
    const centers = await this.prisma.serviceCenter.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, centerName: true },
    });

    const balances = await Promise.all(
      centers.map(async (center) => {
        const balance = await this.getCenterBalance(center.id);
        return {
          ...balance,
          centerName: center.centerName,
        };
      })
    );

    return balances;
  }

  /**
   * Create or get Paystack recipient for center
   */
  async ensurePaystackRecipient(centerId: string): Promise<string> {
    let recipient = await this.prisma.paystackRecipient.findUnique({
      where: { centerId },
    });

    if (!recipient) {
      const center = await this.prisma.serviceCenter.findUnique({
        where: { id: centerId },
      });

      if (
        !center ||
        !center.bankName ||
        !center.bankAccount ||
        !center.bankCode
      ) {
        throw new Error(
          "Center bank details not complete. Please ensure bankName, bankAccount, and bankCode are set."
        );
      }

      // Verify account with Paystack first
      try {
        const accountVerification =
          await this.paystackService.verifyAccountNumber(
            center.bankAccount,
            center.bankCode
          );

        // Create recipient with Paystack
        const paystackResult = await this.paystackService.createRecipient({
          type: "nuban",
          name: center.accountName || accountVerification.account_name,
          account_number: center.bankAccount,
          bank_code: center.bankCode,
          currency: "NGN",
        });

        // Save to database
        recipient = await this.prisma.paystackRecipient.create({
          data: {
            centerId,
            recipientCode: paystackResult.recipient_code,
            reference:
              paystackResult.reference ||
              CryptoUtils.generateRecipientReference(centerId),
            bankName: center.bankName,
            bankCode: center.bankCode,
            accountNumber: center.bankAccount,
            accountName: center.accountName || accountVerification.account_name,
          },
        });
      } catch (error) {
        throw new Error(
          `Failed to create Paystack recipient: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }

    return recipient.recipientCode;
  }

  /**
   * Create manual payout for specific center
   */
  async createManualPayout(params: CreateManualPayoutParams) {
    const { centerId, amount, transactionIds, initiatedBy, reason } = params;

    // Validate transactions
    const transactions = await this.prisma.transaction.findMany({
      where: {
        id: { in: transactionIds },
        status: "COMPLETED",
        payoutItem: null, // Not already paid out
        appointments: {
          some: { centerId },
        },
      },
      include: {
        appointments: {
          include: {
            center: { select: { centerName: true } },
            patient: { select: { fullName: true } },
            screeningType: { select: { name: true } },
          },
        },
      },
    });

    if (transactions.length !== transactionIds.length) {
      throw new Error(
        "Some transactions are invalid, already paid out, or belong to a different center"
      );
    }

    const totalAmount = transactions.reduce(
      (sum, tx) => sum + Number(tx.amount),
      0
    );
    if (Math.abs(totalAmount - amount) > 0.01) {
      throw new Error(
        `Amount mismatch: expected ₦${totalAmount}, received ₦${amount}`
      );
    }

    // Create payout
    const payout = await this.prisma.payout.create({
      data: {
        batchReference: CryptoUtils.generatePayoutBatchReference(),
        payoutNumber: CryptoUtils.generatePayoutNumber(),
        centerId,
        amount: totalAmount,
        netAmount: totalAmount - 10, // Subtract Paystack fee
        status: "PENDING",
        type: "MANUAL",
        initiatedBy,
        periodStart: new Date(
          Math.min(...transactions.map((tx) => tx.createdAt.getTime()))
        ),
        periodEnd: new Date(
          Math.max(...transactions.map((tx) => tx.createdAt.getTime()))
        ),
        reason: reason || "Manual payout for completed appointments",
        payoutItems: {
          create: transactions.map((tx) => {
            const appointment = tx.appointments[0];
            return {
              transactionId: tx.id,
              amount: tx.amount,
              description: `${appointment?.screeningType.name} for ${appointment?.patient.fullName}`,
              serviceDate: appointment?.appointmentDateTime || tx.createdAt,
              appointmentId: appointment?.id,
            };
          }),
        },
      },
      include: {
        payoutItems: true,
        center: { select: { centerName: true } },
      },
    });

    return payout;
  }

  /**
   * Process payout (initiate Paystack transfer)
   */
  async processPayout(payoutId: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
      include: { center: true },
    });

    if (!payout || payout.status !== "PENDING") {
      throw new Error("Payout not found or not in pending status");
    }

    try {
      // Ensure Paystack recipient exists
      const recipientCode = await this.ensurePaystackRecipient(payout.centerId);

      // Generate unique transfer reference
      const transferReference = CryptoUtils.generateTransferReference();

      // Initiate transfer
      const transferResult = await this.paystackService.initiateTransfer({
        source: "balance",
        amount: Math.round(Number(payout.amount) * 100), // Convert to kobo
        recipient: recipientCode,
        reason: payout.reason,
        reference: transferReference,
      });

      // Update payout with transfer details
      const updatedPayout = await this.prisma.payout.update({
        where: { id: payoutId },
        data: {
          status:
            transferResult.status === "success" ? "SUCCESS" : "PROCESSING",
          transferReference,
          paystackTransferId: transferResult.id.toString(),
          processedAt: new Date(),
          completedAt: transferResult.status === "success" ? new Date() : null,
          recipientId: (
            await this.prisma.paystackRecipient.findUnique({
              where: { centerId: payout.centerId },
            })
          )?.id,
        },
        include: {
          center: { select: { centerName: true } },
          payoutItems: true,
        },
      });

      return {
        payout: updatedPayout,
        transfer: transferResult,
      };
    } catch (error) {
      // Update payout as failed
      await this.prisma.payout.update({
        where: { id: payoutId },
        data: {
          status: "FAILED",
          failureReason:
            error instanceof Error ? error.message : "Unknown error",
          retryCount: { increment: 1 },
        },
      });

      throw error;
    }
  }

  /**
   * AUTOMATED MONTHLY PAYOUTS - For cron job
   */
  async processMonthlyPayouts(): Promise<MonthlyPayoutResult> {
    const results: MonthlyPayoutResult = {
      processed: 0,
      failed: 0,
      totalAmount: 0,
      details: [],
    };

    // Get all active centers
    const centers = await this.prisma.serviceCenter.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, centerName: true },
    });

    const batchReference = CryptoUtils.generatePayoutBatchReference();
    const currentDate = new Date();
    const periodStart = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    ); // Start of current month

    for (const center of centers) {
      try {
        // Get eligible balance
        const balance = await this.getCenterBalance(center.id);

        if (balance.eligibleAmount < 100) {
          // Minimum ₦100 payout
          results.details.push({
            centerId: center.id,
            centerName: center.centerName,
            status: "skipped",
            amount: balance.eligibleAmount,
            error: "Below minimum payout threshold (₦100)",
          });
          continue;
        }

        // Create automated payout
        const payout = await this.prisma.payout.create({
          data: {
            batchReference,
            payoutNumber: CryptoUtils.generatePayoutNumber(),
            centerId: center.id,
            amount: balance.eligibleAmount,
            netAmount: balance.eligibleAmount - 10,
            status: "PENDING",
            type: "AUTOMATED",
            periodStart,
            periodEnd: currentDate,
            reason: `Automated monthly payout for ${currentDate.toLocaleDateString(
              "en-US",
              { month: "long", year: "numeric" }
            )}`,
            payoutItems: {
              create: balance.eligibleTransactions.map((tx) => {
                const appointment = tx.appointments[0];
                return {
                  transactionId: tx.id,
                  amount: tx.amount,
                  description: `${appointment?.screeningType.name} for ${appointment?.patient.fullName}`,
                  serviceDate: appointment?.appointmentDateTime || tx.createdAt,
                  appointmentId: appointment?.id,
                };
              }),
            },
          },
        });

        // Process the payout
        await this.processPayout(payout.id);

        results.processed++;
        results.totalAmount += balance.eligibleAmount;
        results.details.push({
          centerId: center.id,
          centerName: center.centerName,
          status: "success",
          amount: balance.eligibleAmount,
        });
      } catch (error) {
        results.failed++;
        results.details.push({
          centerId: center.id,
          centerName: center.centerName,
          status: "failed",
          amount: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return results;
  }

  /**
   * Get payout history for admin
   */
  async getPayouts(filters?: {
    page?: number;
    limit?: number;
    centerId?: string;
    status?: string;
    type?: string;
    batchReference?: string;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    const where = {
      ...(filters?.centerId && { centerId: filters.centerId }),
      ...(filters?.status && { status: filters.status as any }),
      ...(filters?.type && { type: filters.type as any }),
      ...(filters?.batchReference && {
        batchReference: filters.batchReference,
      }),
    };

    const [payouts, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        include: {
          center: { select: { centerName: true, email: true } },
          payoutItems: {
            include: {
              transaction: {
                include: {
                  appointments: {
                    include: {
                      patient: { select: { fullName: true } },
                      screeningType: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      this.prisma.payout.count({ where }),
    ]);

    return {
      payouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get payout history for specific center
   */
  async getCenterPayouts(
    centerId: string,
    filters?: {
      page?: number;
      limit?: number;
      status?: string;
    }
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    const where = {
      centerId,
      ...(filters?.status && { status: filters.status as any }),
    };

    const [payouts, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        include: {
          payoutItems: {
            include: {
              transaction: {
                include: {
                  appointments: {
                    include: {
                      patient: { select: { fullName: true } },
                      screeningType: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      this.prisma.payout.count({ where }),
    ]);

    return {
      payouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Retry failed payout
   */
  async retryPayout(payoutId: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
    });

    if (!payout || payout.status !== "FAILED") {
      throw new Error("Payout not found or not in failed status");
    }

    if (payout.retryCount >= payout.maxRetries) {
      throw new Error("Maximum retry attempts exceeded");
    }

    // Reset status to pending and process
    await this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        status: "PENDING",
        type: "RETRY",
        failureReason: null,
      },
    });

    return this.processPayout(payoutId);
  }

  /**
   * Get transaction/receipt history for specific center
   */
  async getCenterTransactionHistory(
    centerId: string,
    filters?: {
      page?: number;
      limit?: number;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    const where = {
      appointments: {
        some: { centerId },
      },
      ...(filters?.status && { status: filters.status as any }),
      ...(filters?.startDate &&
        filters?.endDate && {
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
    };

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          appointments: {
            include: {
              patient: { select: { fullName: true, email: true } },
              screeningType: { select: { name: true } },
            },
          },
          payoutItem: {
            include: {
              payout: {
                select: {
                  id: true,
                  payoutNumber: true,
                  status: true,
                  completedAt: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    // Calculate totals
    const totals = await this.prisma.transaction.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    });

    return {
      transactions,
      totals: {
        totalAmount: Number(totals._sum.amount) || 0,
        totalCount: totals._count,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
