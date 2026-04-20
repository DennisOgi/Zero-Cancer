import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Blog Seed Script
 * Seeds blog categories and sample blog posts
 */

async function main() {
  console.log("🌱 Seeding blog data...\n");

  try {
    // Get admin user
    const admin = await prisma.admins.findFirst({
      where: { email: "ttaiwo4910@gmail.com" },
    });

    if (!admin) {
      console.error("❌ Admin user not found. Please run main seed first.");
      return;
    }

    // 1. Create blog categories
    console.log("📚 Creating blog categories...");
    
    const categories = [
      {
        name: "PREVENTION & AWARENESS",
        slug: "prevention-awareness",
        description: "Articles about cancer prevention and raising awareness",
      },
      {
        name: "ASK THE EXPERT",
        slug: "ask-the-expert",
        description: "Expert advice and answers to common questions",
      },
      {
        name: "SURVIVOR STORIES",
        slug: "survivor-stories",
        description: "Inspiring stories from cancer survivors",
      },
      {
        name: "EARLY DETECTION",
        slug: "early-detection",
        description: "Information about early cancer detection methods",
      },
      {
        name: "COMMUNITY",
        slug: "community",
        description: "Community updates and initiatives",
      },
    ];

    const createdCategories = [];
    for (const category of categories) {
      const existing = await prisma.blogCategory.findUnique({
        where: { slug: category.slug },
      });

      if (!existing) {
        const created = await prisma.blogCategory.create({
          data: category,
        });
        createdCategories.push(created);
        console.log(`   ✅ Created category: ${category.name}`);
      } else {
        createdCategories.push(existing);
        console.log(`   ⏭️  Category already exists: ${category.name}`);
      }
    }

    console.log(`\n📝 Creating sample blog posts...\n`);

    // 2. Create sample blog posts
    const posts = [
      {
        title: "Unlocking the Path: Your Guide to HPV Testing for Cervical Cancer",
        slug: "unlocking-path-hpv-testing-cervical-cancer",
        excerpt: "In this guide, we uncover the vital aspects of an effective HPV test, shedding light on the importance of identifying high-risk strains and...",
        content: `Here we will discuss the ideal HPV test, how to prepare for it, find a center near you, fund the test and collect the sample. Upon completion of the test and if it turns out negative what should you do next, but if it is positive, how should you treat it and from where can you receive funding support?

## The Ideal HPV Test

There are various types or strains of Human Papilloma Virus (HPV) and not all of them have the high risk of causing cervical cancer. Those which have the high risk of causing cervical cancer are called the high risk strains. There are several of them. They include Types 16 and 18 which are responsible for 70% of cases and types 31, 33, 35,45,52,58, being responsible for the remaining 30%.

The presence of these high risk strains does not mean cancer will occur. It is their persistence. In other words, our bodies have the ability to eliminate them in 80% of cases. It is only in the 20% of them which persist that cancer occurs. These persistent ones have been shown to cause cancer by the expression of some proteins which causes transformative changes in the cervical cells (pre-cancer) which may eventually result to cancer if not treated. These proteins are called oncoproteins, shortened from two words – "oncogenic proteins", meaning cancer-causing proteins whereas the word "onco" is Latin for cancer. The oncoproteins in high risk strains of HPV are E6&E7 and the screening test for them should be oncogenic HPV.

Therefore an ideal HPV test should NOT ONLY find these high-risk types but should also detect the presence of the oncoproteins E6 & E7. The presence of any of the high risk HPV with these oncoproteins in a woman for many years can lead to cell changes that may eventually result to cervical cancer if not treated in time.

To book for your Oncogenic HPV screen or to find a center near you [click here](#).

## Preparing for an HPV Test

There are preparations (dos and don'ts) for the woman desiring to do the HPV testing. These are steps you to ensure the best possible result is gotten from the HPV test.

- Avoid scheduling your test on a day expected to be on your menstrual period. If your period begins unexpectedly and will be continuing on the day of your test, try to reschedule the appointment.
- Avoid sexual intercourse 48 hours before the test.
- Do not douche (clean your vaginal with a liquid) 48 hours before the test.
- Do not use tampons, or vaginal creams, foams, films, or jellies (such as spermicides or medications inserted into the vagina) for 48 hours before the test

## Finding a Center for HPV Test

Ask your doctor for the nearest center to you for the oncogenic HPV testing but if you don't have a doctor or need immediate direction click the explorer to find the nearest center to you or [click here](#) to get there quickly.

## Funding the HPV Test

Paying for the HPV test can happen in three ways –health insurance, out-of-pocket and loan. Sometimes, the screening may be funded by NGOs and philanthropists.

For a list of Health Management Organizations (HMOs) with premium policies that cover cervical cancer screening, [click here](#). In the absence of insurance coverage, the woman may have to pay out of her pocket for the screening but if she cannot afford it, she can access a Cancer Screening Loan (CSL) from a third party partner bank – Sterling Bank. This loan can be paid over a period of months.

She may also [register here](#) and indicate interest in free screening so that she would be notified when philanthropists, celebrants or NGOs fund free screenings or schedule for medical outreaches in their communities.

## How to Collect the Sample

A sample of cells or fluid collected from the cervix is used to test for the presence of Human Papilloma Virus. This sample can be collected by the health worker using special instruments or by the woman using a Do-It-Yourself (DIY) device such as Delphi Vaginal Self Sampler (DVSS) from Mobilab USA. Sample collected by this method remains viable for 6 hours.

Watch the video to see how to collect your sample of cervical lavage.

## When the HPV Test is Negative?

If the oncogenic HPV Test turns out negative, it means you don't have the virus with an accuracy that depends on the sensitivity of the test kit used. You may at this time receive your vaccination if not previously received. You may also repeat the test after 3-5 years.

## When the HPV Test is Positive?

If your HPV test is positive, additional test will need to be performed for further assessment and treatment if need be. If possible this test should be done immediately if the facilities and resources are available.

These most valuable method for further assessment is Colposcopy. If the center she did the screening does not have this equipment, they will refer her to one that performs the service. Alternatively she can use the Centre Explorer above to search for the nearest center in her city or state that has the facility.

If she finds a center with Colposcopy but cannot afford it immediately, she can access a Cancer Screening Loan (CSL) from a Partner Bank – Sterling Bank by [registering here](#). This loan can be paid over a period of months.

She may also use her health insurance to access this service if her policy covers the treatment.

If the colposcopy and associated tests such as biopsy confirm a case of cancer, she can access the Cancer Health Fund of the Federal Government of Nigeria by [clicking here](#), if she needs help with treatment costs.

## WHAT IS COLPOSCOPY?

Colposcopy is an examination of the vagina and cervix using a lighted magnifying instrument called a colposcope. It has the capacity to illuminate the cervix, enable collection of biopsy (tissue for analysis) and performance of treatment depending on what the doctor sees during the procedure.

The following assessment and treatment procedures can be done during a colposcopy depending on the findings and needs:

**Colposcopic biopsy:** While viewing your cervix with a colposcope, the healthcare provider may remove a small amount of tissue which will be sent to a laboratory where another doctor examines it with for precancerous or cancer cells. You may experience some bleeding and discharge after the exam and discomfort similar to menstrual cramps. Ibuprofen can be taken to relieve these symptoms

**Cone biopsy:** A cone-shaped sample of tissue is removed from the cervix to see if abnormal cells are in the tissue beneath the surface of the cervix. This specimen is much bigger than the biopsy done in the office without anesthesia. A sample of tissue can be removed for a cone biopsy using a LEEP cone procedure, which can be done under local anesthesia, or a knife cone procedure, done in an operating room under local or general anesthesia. You may have some vaginal bleeding for about a week and some spotting for about three weeks after the procedure.

**LEEP (Loop Electro-Surgical Excision Procedure):** The LEEP is performed using a small heated wire to remove tissue and precancerous cells from the cervix. This procedure can be done in your provider's office and requires local anesthesia. There may be some cramping during and after the procedure. You may have moderate to heavy vaginal discharge that lasts for up to three weeks.

**Cryotherapy:** This is a procedure in which an extremely cold liquid or an instrument called a cryoprobe is used to freeze and destroy abnormal tissue

## Conclusion

In conclusion, navigating through HPV testing for cervical cancer requires thorough understanding and preparedness. From selecting the ideal HPV test to collecting samples and interpreting results, each step is crucial in ensuring early detection and timely treatment. Whether the outcome is negative or positive, knowing the next course of action, including accessing further assessments like colposcopy and exploring funding options, empowers individuals to take charge of their health journey. By equipping oneself with knowledge and resources, women can proactively safeguard their well-being against cervical cancer.`,
        coverImage: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=600&fit=crop",
        categories: ["prevention-awareness", "ask-the-expert"],
        published: true,
        publishedAt: new Date("2024-04-17"),
      },
      {
        title: "Bridging Gaps, Saving Lives: Zerocancer's Community Outreach",
        slug: "bridging-gaps-saving-lives-community-outreach",
        excerpt: "Zerocancer is a proactive force in battling cancer, going beyond awareness campaigns to focus on prevention, early detection, and...",
        content: `In a world where the specter of cancer looms large, Zerocancer emerges not merely as a campaign, but as a beacon of proactive hope. With unwavering dedication, we transcend the boundaries of traditional awareness initiatives, delving deep into the realms of prevention, early detection, and equitable access to care. At the heart of our mission lies a commitment to reducing the incidence of cervical, breast, prostate, and colon cancers through a meticulously crafted tapestry of education, screening, partnerships, and community outreach.

## Empowering the At-Risk

Our journey begins with the onboarding of populations at risk, a pivotal moment where information becomes empowerment. Through our platform, individuals gain access to a wealth of knowledge on cancer prevention, diagnosis, and treatment modalities. No longer hindered by financial barriers, they are offered opportunities for free or subsidized screenings and immunizations, ensuring that every individual has a fighting chance against this formidable adversary.

## Guiding Lights in the Dark

For those thrust into the tumultuous waters of a cancer diagnosis, Zerocancer stands as a steadfast companion. We serve as conduits of connection, bridging the chasm between patients and the most affordable care options available. Through our network, we weave threads of support, linking individuals with philanthropists and non-profits dedicated to easing the burdens of treatment and recovery.

## Championing Early Detection

Central to our ethos is the belief that early detection can tilt the scales in favor of survival. In partnership with healthcare professionals, governments, and non-profit organizations, we orchestrate a symphony of follow-up care and interventions for high-risk individuals. By catching cancer in its nascent stages, we offer a lifeline of prevention and early intervention, guiding individuals towards brighter tomorrows.

## Bridging Communities, Fostering Change

Yet our impact transcends individual journeys; we are architects of systemic change. Zerocancer serves as a nexus, uniting non-profits, governments, donors, and vulnerable communities in a shared mission. Through meticulous identification and connection, we facilitate targeted interventions and outreaches, addressing the unique needs of each population group with precision and compassion.

## Forging Partnerships, Securing Solutions

Our partnerships extend beyond borders and boundaries, encompassing manufacturers, representatives, and vendors of cancer screening kits and equipment. Through collaborative efforts, we negotiate discounted products and services, dismantling the barriers of affordability and accessibility. By democratizing access to screening, we pave the way for a future where no one is left behind in the fight against cancer.

## A Vision of Unity, A Mission of Impact

Our vision is audacious, yet within reach – to onboard 500 million Africans within five years, igniting flames of awareness, opportunity, and hope. Zerocancer is more than a mere initiative; it is a collective force for change, a symphony of voices rising against the tide of despair. Together, through education, outreach, and unwavering solidarity, we can rewrite the narrative of cancer, one life, and one community at a time.

Join us in our crusade to illuminate paths and save futures. Together, we can turn the tide against cancer, transforming darkness into dawn and despair into hope. Join us, and together, let us forge a world where cancer is not a death sentence, but a hurdle overcome, and where every life is cherished, celebrated, and safeguarded.`,
        coverImage: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=1200&h=600&fit=crop",
        categories: ["community"],
        published: true,
        publishedAt: new Date("2024-03-25"),
      },
      {
        title: "Empowering Lives: A Guide to Early Cancer Detection",
        slug: "empowering-lives-guide-early-cancer-detection",
        excerpt: "In this post, explore the vital role of early cancer detection with a guide on screening methods, risk factors, and proactive measures.",
        content: `In the journey of life, unexpected challenges can arise, and few are as daunting as a cancer diagnosis. While the word itself can evoke fear and uncertainty, it's essential to remember that early detection can be a powerful tool in the fight against this disease. Empowering individuals with the knowledge and tools for early cancer detection can make a significant difference in outcomes and quality of life. In this guide, we'll explore the importance of early detection, the methods available, and how you can take proactive steps to safeguard your health.

## Understanding the Importance of Early Detection

Early detection of cancer can significantly increase the chances of successful treatment and survival. Detecting cancer in its early stages often means it's smaller and hasn't spread to other parts of the body, making it more manageable to treat. Moreover, early diagnosis can offer more treatment options, potentially reducing the need for aggressive interventions such as chemotherapy or surgery.

## Key Methods for Early Detection

### 1. Regular Screening Tests

Screening tests are crucial for detecting cancer before symptoms appear. These tests can include mammograms for breast cancer, Pap tests for cervical cancer, colonoscopies for colorectal cancer, and prostate-specific antigen (PSA) tests for prostate cancer. The frequency and timing of these tests may vary depending on individual risk factors and medical history, so it's important to consult with a healthcare professional to determine the appropriate screening schedule.

### 2. Pay Attention to Your Body

Being attuned to changes in your body is another essential aspect of early detection. If you notice any unusual symptoms such as lumps, changes in bowel or bladder habits, persistent coughs, or unexplained weight loss, it's crucial to promptly consult with a healthcare provider. While these symptoms may not always indicate cancer, they should not be ignored, as they could be early warning signs of various health issues that require attention.

### 3. Know Your Family History

A family history of cancer can significantly increase your risk of developing the disease. Therefore, knowing your family's medical history is vital for understanding your own risk factors. If you have close relatives who have been diagnosed with cancer, especially at a young age, inform your healthcare provider. They may recommend additional screenings or genetic testing to assess your risk more accurately.

## Taking Proactive Steps for Your Health

Beyond regular screenings and paying attention to your body, there are several proactive steps you can take to reduce your risk of developing cancer:

**Maintain a Healthy Lifestyle:** Adopting a balanced diet, engaging in regular exercise, avoiding tobacco products, limiting alcohol consumption, and maintaining a healthy weight can all contribute to lowering your risk of cancer.

**Protect Yourself from Environmental Hazards:** Minimize exposure to known carcinogens such as asbestos, radon, and ultraviolet (UV) radiation from the sun by taking appropriate precautions such as wearing protective clothing, using sunscreen, and avoiding prolonged exposure to the sun during peak hours.

**Stay Informed:** Keep yourself updated on the latest research and recommendations regarding cancer prevention and early detection. Attend health screenings and educational events in your community to stay informed and empowered to take charge of your health.

## Conclusion

In conclusion, early detection plays a crucial role in the fight against cancer. By understanding the importance of early detection, familiarizing yourself with available screening methods, paying attention to your body, knowing your family history, and taking proactive steps for your health, you can empower yourself to detect cancer early, potentially saving lives and improving outcomes. Remember, knowledge is power, and by staying informed and proactive, you can be an active participant in safeguarding your health and well-being.`,
        coverImage: "https://images.unsplash.com/photo-1584515933487-779824d29309?w=1200&h=600&fit=crop",
        categories: ["early-detection", "prevention-awareness"],
        published: true,
        publishedAt: new Date("2024-03-23"),
      },
    ];

    for (const postData of posts) {
      const existing = await prisma.blogPost.findUnique({
        where: { slug: postData.slug },
      });

      if (!existing) {
        // Create the post
        const post = await prisma.blogPost.create({
          data: {
            title: postData.title,
            slug: postData.slug,
            excerpt: postData.excerpt,
            content: postData.content,
            coverImage: postData.coverImage,
            authorId: admin.id,
            published: postData.published,
            publishedAt: postData.publishedAt,
          },
        });

        // Add categories
        for (const categorySlug of postData.categories) {
          const category = createdCategories.find((c) => c.slug === categorySlug);
          if (category) {
            await prisma.blogPostCategory.create({
              data: {
                postId: post.id,
                categoryId: category.id,
              },
            });
          }
        }

        console.log(`   ✅ Created post: ${postData.title}`);
      } else {
        console.log(`   ⏭️  Post already exists: ${postData.title}`);
      }
    }

    console.log("\n✅ Blog seeding complete!\n");
    console.log("📊 Summary:");
    console.log(`   - Categories: ${createdCategories.length}`);
    console.log(`   - Sample posts: ${posts.length}`);
    console.log("\n🎉 You can now access the blog at /blog\n");
  } catch (error) {
    console.error("❌ Error seeding blog:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
