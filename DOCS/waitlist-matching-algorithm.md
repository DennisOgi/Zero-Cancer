# Waitlist Matching Algorithm Documentation

## Overview

The ZeroCancer Waitlist Matching Algorithm is an enhanced system designed to efficiently match patients on waitlists with available donation campaigns for medical screenings. This algorithm has been optimized for performance, accuracy, and comprehensive tracking.

## Business Logic & Core Features

### 🏥 **Core Matching Rules**

1. **Patient Eligibility Requirements**

   - Patient must have **fewer than 3 unclaimed allocations** (business limit)
   - Patient cannot have existing **MATCHED** allocation for the same screening type
   - Patient must be in **PENDING** status on the waitlist
   - Patient must meet campaign targeting criteria (if targeting enabled)

2. **First-Come-First-Served (FCFS) Processing**

   - Patients processed in order of waitlist **`joinedAt`** timestamp
   - Earlier joiners get priority for limited campaign funds
   - Batch processing respects FCFS within each screening type

3. **Campaign Selection Hierarchy**

   - **Targeted Campaigns** (highest priority)
     - Campaigns with demographic/geographic targeting that matches patient
     - More specific campaigns (fewer screening types) prioritized over general ones
     - Higher available amounts preferred over lower amounts
     - Older campaigns (earlier `createdAt`) get priority when tied
   - **General Pool Campaign** (fallback)
     - Used when no targeted campaigns match or qualify
     - Must have sufficient funds (`availableAmount >= agreedPrice`)
     - Campaign ID: `"general-donor-pool"`

4. **Fund Management**
   - Campaign **`availableAmount`** decremented by screening **`agreedPrice`**
   - Campaign **`reservedAmount`** incremented (optional field)
   - Allocation created with **`amountAllocated`** = screening agreed price
   - No partial funding - full screening cost must be available

### 🎯 **Advanced Targeting System**

1. **Demographic Targeting**

   - **Age Range**: `targetAgeMin` and `targetAgeMax` with patient age calculation
   - **Gender Matching**: Multiple target genders supported (`targetGender[]`)
   - **Income Brackets**: `targetIncomeMin` and `targetIncomeMax` filtering

2. **Geographic Targeting**

   - **State-Level**: `targetStates[]` array matching patient state
   - **LGA-Level**: `targetLgas[]` array for Local Government Area targeting
   - **Priority**: LGA matches score higher than state-only matches

3. **Targeting Score Algorithm**
   ```
   Score Calculation:
   - Age Match: +10 points
   - Gender Match: +15 points
   - State Match: +20 points
   - LGA Match: +25 points (most specific)
   - Income Match: +10 points
   Maximum Score: 80 points
   ```

### 📋 **Workflow & Status Management**

1. **Waitlist Status Transitions**

   ```
   PENDING → MATCHED → (Patient Claims) → CLAIMED
                   → (Auto-Expires) → EXPIRED → (Can Rejoin) → PENDING
   ```

2. **Allocation Lifecycle**

   - Created with **`claimedAt: null`** (unclaimed state)
   - Patient claims allocation to book appointment
   - **Automatic expiry**: Unclaimed MATCHED allocations expire after configured days
   - **Fund return**: Expired allocations return funds to original campaigns
   - **Status transition**: MATCHED → EXPIRED → (patient can rejoin waitlist)
   - Unclaimed allocations count toward 3-allocation limit (EXPIRED don't count)
   - Expiry notifications sent to patients via email and in-app

3. **Campaign Status Requirements**
   - Only **ACTIVE** campaigns participate in matching
   - Campaigns with **`availableAmount > 0`** are eligible
   - Inactive or depleted campaigns automatically excluded

### 🔄 **Processing & Performance Features**

1. **Batch Processing Strategy**

   - Configurable batch sizes per screening type (`patientsPerScreeningType`)
   - Maximum total patients per execution (`maxTotalPatients`)
   - Smart patient filtering to respect business rules

2. **Database Optimization**

   - **Single Query Approach**: One comprehensive query fetches all required data
   - **Batch Transactions**: Multiple operations grouped into atomic transactions
   - **Efficient Joins**: Patient profiles, allocations, and campaigns loaded together

3. **Parallel Processing (Optional)**
   - Multiple screening types processed concurrently
   - Configurable concurrency limit (`maxConcurrentScreeningTypes`)
   - Database-safe with transaction isolation

### 🔔 **Notification & Communication**

1. **Patient Notifications**

   - **Type**: `MATCHED` notification type
   - **Channels**: In-app notification + optional email
   - **Content**: Screening details, campaign info, next steps
   - **Data**: Screening type ID, campaign ID, execution reference

2. **Donor Notifications**
   - **Type**: `PATIENT_MATCHED` notification type
   - **Channels**: In-app notification + email
   - **Content**: Patient matched to their campaign
   - **Data**: Patient anonymized info, screening type, allocation details

### 📊 **Tracking & Audit Features**

1. **Execution-Level Tracking**

   - Unique execution reference for each algorithm run
   - Start/end timestamps and total processing time
   - Global metrics: patients processed, matches created, funds allocated
   - Configuration snapshot for reproducibility

2. **Screening Type Analytics**

   - Per-screening-type success rates and processing times
   - Campaign utilization patterns and effectiveness
   - Patient demographic distributions and targeting success

3. **Detailed Operation Logs**

   - Every significant operation logged with context
   - Patient-level processing decisions and outcomes
   - Error tracking with stack traces for debugging
   - Campaign selection reasoning and targeting scores

4. **Performance Monitoring**
   - Database query counts and execution times
   - Transaction batch performance metrics
   - Notification delivery success rates
   - Resource utilization and bottleneck identification

### ⏰ **Allocation Expiry System**

1. **Automatic Expiry Process**

   - Runs at the start of each algorithm execution
   - Finds MATCHED waitlists older than `allocationExpiryDays`
   - Transitions waitlist status from MATCHED to EXPIRED
   - Returns allocated funds to original campaigns
   - Sends expiry notifications to affected patients

2. **Expiry Business Rules**

   - **Expiry Threshold**: Based on waitlist `joinedAt` date + `allocationExpiryDays`
   - **Fund Recovery**: Full allocation amount returned to campaign `availableAmount`
   - **Patient Limits**: EXPIRED allocations don't count toward 3-allocation limit
   - **Rejoin Capability**: Patients can rejoin waitlist after expiry
   - **Notification**: Email and in-app notifications sent to patients

3. **Expiry Tracking & Metrics**
   - Number of allocations expired per execution
   - Total funds returned to campaigns
   - Expiry error tracking and logging
   - Per-execution expiry performance metrics

### ⚙️ **Configuration & Flexibility**

1. **Environment-Based Configuration**

   - Batch processing parameters (sizes, limits, concurrency)
   - Targeting enable/disable flags
   - Allocation expiry settings
   - Performance tuning options

2. **Runtime Configuration Override**

   - Custom batch configurations per execution
   - A/B testing support with different parameters
   - Emergency overrides for special circumstances

3. **Business Rule Flexibility**
   - Configurable allocation limits per patient
   - Adjustable targeting strictness
   - Campaign prioritization logic customization

## Version 2.0 Technical Enhancements

### 🚀 Performance Optimizations

- **Single Query Approach**: Eliminates N+1 query problems by fetching all required data in one comprehensive database query
- **Batch Processing**: Configurable batch sizes for efficient processing without overwhelming the system
- **Parallel Processing**: Optional concurrent processing of screening types
- **Transaction-based Operations**: Ensures data consistency through database transactions

### 🎯 Intelligent Matching

- **Demographic Targeting**: Matches patients based on age, gender, income, and geographic location
- **Campaign Prioritization**: Smart campaign selection based on targeting scores and specificity
- **Fallback to General Pool**: Uses general donor pool when no targeted campaigns match

### 📊 Comprehensive Tracking

- **Execution Tracking**: Every algorithm run is tracked with unique reference IDs
- **Detailed Metrics**: Performance, success rates, and resource utilization metrics
- **Audit Logging**: Complete audit trail of all matching decisions and errors
- **Screening Type Breakdown**: Per-screening-type analytics and performance data

## Algorithm Flow

### 1. Initialization & Cleanup

```
Start Algorithm → Load Configuration → Create Execution Record →
Expire Old Allocations → Initialize Metrics
```

### 2. Data Fetching

```
Single Database Query → Fetch All Waitlists with:
├── Patient Profile Data
├── Donation Allocations
├── Screening Types
└── Available Campaigns
```

### 3. Processing Strategy

```
Group by Screening Type →
├── Sequential Processing (default)
└── Parallel Processing (optional)
```

### 4. Patient Eligibility Check

For each patient:

- ✅ Has less than 3 unclaimed allocations
- ✅ No existing MATCHED allocation for this screening type
- ✅ Meets campaign targeting criteria

### 5. Campaign Selection Priority

1. **Targeted Campaigns** (highest priority)

   - Demographic match (age, gender, income)
   - Geographic match (state, LGA)
   - Campaign specificity (fewer screening types = higher priority)
   - Available amount (higher = better)
   - Creation date (older = higher priority)

2. **General Pool Campaign** (fallback)
   - Used when no targeted campaigns match
   - Must have sufficient available funds

### 6. Match Creation

```
Selected Campaign →
├── Update Campaign (decrement available amount)
├── Update Waitlist (status = MATCHED)
├── Create Donation Allocation
└── Send Notifications (patient + donor)
```

## Configuration Options

### Environment Variables

```bash
# Batch Processing
WAITLIST_BATCH_SIZE=50              # Patients per screening type
WAITLIST_MAX_TOTAL=500              # Maximum total patients per run
WAITLIST_PARALLEL=false             # Enable parallel processing
WAITLIST_CONCURRENT=5               # Max concurrent screening types

# Targeting
WAITLIST_DEMOGRAPHIC_TARGETING=true # Enable demographic targeting
WAITLIST_GEOGRAPHIC_TARGETING=true  # Enable geographic targeting

# Allocations
WAITLIST_EXPIRY_DAYS=30             # Days before allocation expires
```

### Runtime Configuration

```typescript
const config: BatchConfig = {
  patientsPerScreeningType: 50,
  maxTotalPatients: 500,
  enableParallelProcessing: false,
  maxConcurrentScreeningTypes: 5,
  enableDemographicTargeting: true,
  enableGeographicTargeting: true,
  allocationExpiryDays: 30,
};
```

## Database Schema Integration

### Core Tables

- **`waitlist`**: Patient waitlist entries
- **`donationCampaign`**: Available funding campaigns
- **`donationAllocation`**: Created matches between patients and campaigns
- **`user`**: Patient and donor information

### Tracking Tables (New in V2.0)

- **`matchingExecution`**: High-level execution tracking
- **`matchingExecutionLog`**: Detailed operation logs
- **`matchingScreeningTypeResult`**: Per-screening-type results

## Targeting System

### Demographic Targeting

```typescript
// Age Targeting
campaign.targetAgeMin: 18
campaign.targetAgeMax: 65
patient.age: 25 → ✅ Match

// Gender Targeting
campaign.targetGender: ["FEMALE", "MALE"]
patient.gender: "FEMALE" → ✅ Match

// Income Targeting
campaign.targetIncomeMin: 50000
campaign.targetIncomeMax: 200000
patient.monthlyIncome: 75000 → ✅ Match
```

### Geographic Targeting

```typescript
// State Targeting
campaign.targetStates: ["LAGOS", "ABUJA"]
patient.state: "LAGOS" → ✅ Match

// LGA Targeting
campaign.targetLgas: ["IKEJA", "VICTORIA_ISLAND"]
patient.lga: "IKEJA" → ✅ Match
```

### Targeting Score Calculation

```
Total Score = Age Match (10) + Gender Match (15) +
              State Match (20) + LGA Match (25) +
              Income Match (10)
Maximum Possible Score: 80 points
```

## Performance Metrics

### Execution Metrics

- **Processing Time**: Total algorithm execution time
- **Database Queries**: Number of database operations
- **Transaction Batches**: Number of batch transactions executed
- **Notifications Sent**: Number of notifications dispatched

### Matching Metrics

- **Patients Evaluated**: Total patients processed
- **Successful Matches**: Number of successful patient-campaign matches
- **Skip Reasons**: Categorized reasons for skipped patients
- **Funds Allocated**: Total monetary value of allocations created
- **Campaigns Used**: Number of unique campaigns utilized

### Screening Type Breakdown

- **Per-Type Statistics**: Individual performance metrics for each screening type
- **Campaign Involvement**: Which campaigns were used for each screening type
- **Processing Time**: Time spent processing each screening type

## Error Handling & Resilience

### Error Categories

1. **Individual Patient Errors**: Logged but don't stop batch processing
2. **Batch Transaction Errors**: Rolled back with detailed logging
3. **System Errors**: Algorithm terminates with comprehensive error reporting

### Error Recovery

- **Graceful Degradation**: Continue processing other patients if one fails
- **Transaction Rollback**: Ensure data consistency in case of batch failures
- **Comprehensive Logging**: All errors logged with context for debugging

## Notifications System

### Patient Notifications

- **Type**: `MATCHED`
- **Message**: Notification about successful matching
- **Channels**: In-app notification + email (optional)
- **Data**: Screening type, campaign info, execution reference

### Donor Notifications

- **Type**: `PATIENT_MATCHED`
- **Message**: Notification about patient being matched to their campaign
- **Channels**: In-app notification + email
- **Data**: Patient info, screening type, allocation details

## API Integration

### Webhook Endpoints

```
POST /api/v1/waitlist/trigger-matching
POST /api/v1/waitlist/manual-trigger
GET  /api/v1/waitlist/matching-status
```

### Manual Execution

```typescript
import { waitlistMatcherAlg } from "./lib/utils";

// Basic execution
const result = await waitlistMatcherAlg();

// Custom configuration
const result = await waitlistMatcherAlg({
  patientsPerScreeningType: 25,
  enableParallelProcessing: true,
});
```

## Monitoring & Analytics

### Real-time Monitoring

- **Execution References**: Unique IDs for tracking specific runs
- **Progress Logging**: Real-time progress updates during execution
- **Performance Metrics**: Processing speed and resource utilization

### Historical Analysis

- **Execution History**: Complete history of all algorithm runs
- **Success Rate Trends**: Matching success rates over time
- **Campaign Effectiveness**: Analysis of campaign targeting effectiveness
- **Resource Utilization**: Database query patterns and optimization opportunities

## Best Practices

### Scheduling

- **Frequency**: Run every 1-2 hours during business hours
- **Off-peak Processing**: Use larger batch sizes during low-traffic periods
- **Monitoring**: Set up alerts for failed executions or low success rates

### Configuration Tuning

- **Batch Size**: Start with 50, adjust based on system performance
- **Parallel Processing**: Enable only if database can handle concurrent load
- **Targeting**: Keep demographic targeting enabled for better matches

### Maintenance

- **Log Retention**: Archive old execution logs to maintain performance
- **Metric Analysis**: Regular review of success rates and optimization opportunities
- **Campaign Review**: Ensure campaign targeting criteria remain relevant

## Troubleshooting

### Common Issues

1. **Low Match Rates**: Check campaign availability and targeting criteria
2. **Performance Issues**: Reduce batch sizes or disable parallel processing
3. **Database Locks**: Implement retry logic for transaction conflicts
4. **Notification Failures**: Check email service configuration

### Debug Information

- **Execution Reference**: Use for tracking specific algorithm runs
- **Detailed Logs**: Check `matchingExecutionLog` table for step-by-step operations
- **Metrics Breakdown**: Analyze screening type results for patterns

## Future Enhancements

### Planned Features

- **Machine Learning Integration**: Predictive matching based on historical success
- **Dynamic Batch Sizing**: Automatic adjustment based on system load
- **Advanced Targeting**: Integration with additional patient data sources
- **Real-time Processing**: Event-driven matching for immediate allocation

### Scalability Considerations

- **Database Optimization**: Additional indexes for performance
- **Caching Layer**: Redis integration for frequently accessed data
- **Microservice Architecture**: Separate matching service for better scalability
- **Message Queues**: Asynchronous processing for large patient volumes
