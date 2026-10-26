const bcrypt = require('bcryptjs');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const Application = require('../models/Application');
const SavedJob = require('../models/SavedJob');
const Event = require('../models/Event');
const Notification = require('../models/Notification');

const seedData = async () => {
  try {
    console.log('🌱 Starting Database Seeding...');
    
    // Connect to database
    await connectDB();

    // 1. Clear existing database
    console.log('🧹 Clearing old collections...');
    await User.deleteMany({});
    await Profile.deleteMany({});
    await Company.deleteMany({});
    await Job.deleteMany({});
    await Resume.deleteMany({});
    await Application.deleteMany({});
    await SavedJob.deleteMany({});
    await Event.deleteMany({});
    await Notification.deleteMany({});

    // 2. Create Users
    console.log('👥 Creating users...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123', salt);

    const admin = await User.create({
      name: 'Sarah Jenkins (Admin)',
      email: 'admin@careerflow.com',
      phone: '+1 (555) 019-2834',
      password: hashedPassword,
      role: 'admin'
    });

    const candidate = await User.create({
      name: 'Alex Rivera',
      email: 'candidate@careerflow.com',
      phone: '+1 (555) 014-9988',
      password: hashedPassword,
      role: 'candidate'
    });

    // 3. Create Companies (15 companies)
    console.log('🏢 Creating companies...');
    const companyData = [
      { name: 'Apex Tech Solutions', logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60', industry: 'Software & Cloud Services', website: 'https://apextech.io', location: 'San Francisco, CA', description: 'Apex Tech builds next-generation cloud services and SaaS productivity tools.' },
      { name: 'BrightFuture Education', logo: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=100&auto=format&fit=crop&q=60', industry: 'EdTech', website: 'https://brightfuture.edu', location: 'Boston, MA', description: 'Transforming online schooling and skill acquisition through virtual classrooms.' },
      { name: 'MediLife Healthcare', logo: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=100&auto=format&fit=crop&q=60', industry: 'Healthcare & Pharma', website: 'https://medilife.com', location: 'Chicago, IL', description: 'Global healthcare leader developing medical informatics and diagnostics software.' },
      { name: 'Verdant Green Energy', logo: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=100&auto=format&fit=crop&q=60', industry: 'Renewable Energy', website: 'https://verdantenergy.com', location: 'Austin, TX', description: 'Providing clean wind and solar power generation infrastructure platforms.' },
      { name: 'FinFlow Ventures', logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=100&auto=format&fit=crop&q=60', industry: 'Fintech', website: 'https://finflow.co', location: 'New York, NY', description: 'Decentralized automated micro-investment platform for retail investors.' },
      { name: 'Vanguard Cyber Security', logo: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=100&auto=format&fit=crop&q=60', industry: 'Cybersecurity', website: 'https://vanguardcyber.net', location: 'Washington, D.C.', description: 'Providing machine learning-driven network defense systems to global enterprises.' },
      { name: 'Nova Logistics & Cargo', logo: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&auto=format&fit=crop&q=60', industry: 'Logistics', website: 'https://novalogistics.com', location: 'Seattle, WA', description: 'Automated global distribution networks powered by automated routing engines.' },
      { name: 'Studio Pixel Design', logo: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=100&auto=format&fit=crop&q=60', industry: 'Creative & Design Agency', website: 'https://studiopixel.design', location: 'Los Angeles, CA', description: 'Award-winning creative branding, design, and UI/UX boutique consultancy.' },
      { name: 'Quantum Analytics', logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&auto=format&fit=crop&q=60', industry: 'Data Science & BI', website: 'https://quantumanalytics.ai', location: 'Denver, CO', description: 'Predictive data modeling pipelines helping e-commerce scale operational logistics.' },
      { name: 'AeroSpace Next', logo: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=100&auto=format&fit=crop&q=60', industry: 'Aerospace & Aviation', website: 'https://aerospacenext.com', location: 'Houston, TX', description: 'Private aerospace manufacturer designing orbital launch hardware components.' },
      { name: 'Cognitive AI', logo: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=100&auto=format&fit=crop&q=60', industry: 'Artificial Intelligence', website: 'https://cognitiveai.net', location: 'Seattle, WA', description: 'NLP and LLM deployment frameworks for automated multi-channel customer relations.' },
      { name: 'BlueWater Retail', logo: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&auto=format&fit=crop&q=60', industry: 'E-Commerce', website: 'https://bluewaterretail.com', location: 'Miami, FL', description: 'Global apparel e-commerce marketplace serving 20+ million monthly users.' },
      { name: 'HealthSync Wellness', logo: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=100&auto=format&fit=crop&q=60', industry: 'Health & Wellness', website: 'https://healthsync.fit', location: 'San Diego, CA', description: 'Personalized wellness and remote coaching application systems.' },
      { name: 'Beacon Real Estate', logo: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=100&auto=format&fit=crop&q=60', industry: 'Real Estate & PropTech', website: 'https://beaconprop.com', location: 'Atlanta, GA', description: 'Digital marketplace for buying, selling, and managing commercial properties.' },
      { name: 'Global Talent Partners', logo: 'https://images.unsplash.com/photo-1521791136368-1a8be0494a62?w=100&auto=format&fit=crop&q=60', industry: 'Recruitment & Staffing', website: 'https://globaltalent.com', location: 'London, UK', description: 'Executive talent search firm connecting top tier technical leads with innovators.' }
    ];

    const companies = [];
    for (const c of companyData) {
      const createdCompany = await Company.create(c);
      companies.push(createdCompany);
    }

    // 4. Create Jobs (30+ jobs)
    console.log('💼 Creating jobs...');
    const categories = ['Engineering', 'Product', 'Data Science', 'Design', 'Marketing', 'Security', 'Sales'];
    const workTypes = ['Remote', 'Hybrid', 'On-site'];
    const experienceLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Lead / Manager'];
    
    // Seed templates for 30 jobs
    const rawJobData = [
      {
        title: 'Senior Frontend Developer (React)',
        company: companies[0]._id, // Apex Tech
        location: 'San Francisco, CA',
        workType: 'Hybrid',
        experience: 'Senior Level',
        salary: '$135,000 - $160,000',
        skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Redux', 'Vite'],
        category: 'Engineering',
        description: 'We are looking for a Senior Frontend Developer to lead the redevelopment of our central SaaS dashboard. You will collaborate closely with product design and backend API engineers to build premium, fast interfaces.',
        responsibilities: [
          'Lead architecting modular components in React and TypeScript.',
          'Optimize web app bundle sizes and loading states.',
          'Collaborate with UI designers to build dynamic dashboards based on Figma mocks.',
          'Mentor junior engineers and run detailed pull request reviews.'
        ],
        requirements: [
          '5+ years of active experience with React and modern CSS systems.',
          'Deep understanding of TypeScript compilation and type-safety paradigms.',
          'Familiarity with state management libraries (Redux Toolkit, Zustand).',
          'Prior experience building data-heavy analytic dashboards.'
        ],
        benefits: ['Full health, dental, and vision insurance', '401(k) matching 5%', 'Flexible working hours', 'Home office equipment stipend ($1,500)']
      },
      {
        title: 'Full Stack Engineer (Node + React)',
        company: companies[0]._id, // Apex Tech
        location: 'Remote',
        workType: 'Remote',
        experience: 'Mid Level',
        salary: '$105,000 - $125,000',
        skills: ['Node.js', 'Express', 'React', 'MongoDB', 'REST API', 'Git'],
        category: 'Engineering',
        description: 'Join our product growth team to design and build new features end-to-end. You will work on backend schemas, express routes, user workflows, and UI cards.',
        responsibilities: [
          'Build secure API endpoints using Express and integrate Mongoose database logic.',
          'Construct interactive page forms and components in React.',
          'Ensure responsive design layouts for mobile and tablet views.',
          'Write comprehensive integration and unit tests for application routes.'
        ],
        requirements: [
          '3+ years of professional backend Node development and React.',
          'Solid understanding of database systems (MongoDB or SQL).',
          'Experience building JWT authentication workflows.'
        ],
        benefits: ['Unlimited Paid Time Off (PTO)', 'Annual remote working retreat', 'Learning & development budget ($2,000/yr)']
      },
      {
        title: 'Senior Cloud Security Analyst',
        company: companies[5]._id, // Vanguard Cyber Security
        location: 'Washington, D.C.',
        workType: 'On-site',
        experience: 'Senior Level',
        salary: '$140,000 - $175,000',
        skills: ['AWS', 'Cybersecurity', 'Docker', 'Kubernetes', 'CI/CD', 'Linux'],
        category: 'Security',
        description: 'Vanguard Cyber Security is seeking an experienced Cloud Security Analyst to design, configure, and monitor secure VPCs, AWS clusters, and infrastructure deployments.',
        responsibilities: [
          'Conduct regular threat modeling and security audits on cloud deployments.',
          'Architect IAM policies and network firewalls following the principle of least privilege.',
          'Automate threat intelligence scans in Gitlab/Github CI/CD pipelines.',
          'Lead incident response reviews.'
        ],
        requirements: [
          'Certified AWS Solutions Architect or security specialization.',
          '5+ years securing production Kubernetes and Docker container structures.',
          'Familiarity with Terraform configuration auditing.'
        ],
        benefits: ['Top-tier healthcare plan', 'Annual security certificate sponsorships', 'Public transit pass coverage', 'Gym membership discount']
      },
      {
        title: 'Junior UI/UX Designer',
        company: companies[7]._id, // Studio Pixel
        location: 'Los Angeles, CA',
        workType: 'Hybrid',
        experience: 'Entry Level',
        salary: '$65,000 - $80,000',
        skills: ['Figma', 'Adobe Creative Suite', 'Prototyping', 'CSS', 'UI Design'],
        category: 'Design',
        description: 'Looking to start your career in creative web design? Studio Pixel is hiring a Junior Designer to support our brand design teams with interface design, prototypes, and asset export.',
        responsibilities: [
          'Design wireframes, components, and high-fidelity mockups under direction of UI Lead.',
          'Build interactive prototypes in Figma for client review.',
          'Participate in creative brainstorming and customer research sessions.',
          'Export assets and provide detailed implementation specifications to developers.'
        ],
        requirements: [
          'BFA or equivalent design portfolio showcasing typography, layout, and visual theory.',
          'Expert level knowledge of Figma.',
          'Basic understanding of HTML/CSS code compilation.'
        ],
        benefits: ['Flexible hybrid schedule (2 days remote)', 'Free office snacks & barista setup', 'Creative license and team mentorship']
      },
      {
        title: 'Lead Data Scientist',
        company: companies[8]._id, // Quantum Analytics
        location: 'Denver, CO',
        workType: 'On-site',
        experience: 'Lead / Manager',
        salary: '$160,000 - $190,000',
        skills: ['Python', 'SQL', 'TensorFlow', 'Pandas', 'Data Science', 'Machine Learning'],
        category: 'Data Science',
        description: 'Quantum Analytics is expanding its data models team. We are looking for a Lead Data Scientist to build neural networks and predict demand forecasting for logistics enterprises.',
        responsibilities: [
          'Formulate and deploy machine learning models predicting market demand spikes.',
          'Organize ETL data pipelines processing gigabytes of transaction records.',
          'Present analytics dashboards to C-level stakeholders.',
          'Supervise a team of three junior data analysts.'
        ],
        requirements: [
          'Master’s or PhD in Statistics, Computer Science, or Mathematics.',
          '5+ years programming predictive models in Python (Scikit-Learn, TensorFlow, PyTorch).',
          'Expert query authoring in PostgreSQL and BigQuery.'
        ],
        benefits: ['Stock options grant', 'Full medical coverage', 'Conference attendance sponsorship', 'Paid parental leave']
      },
      {
        title: 'Product Manager (EdTech Platform)',
        company: companies[1]._id, // BrightFuture Education
        location: 'Boston, MA',
        workType: 'Hybrid',
        experience: 'Mid Level',
        salary: '$110,000 - $130,000',
        skills: ['Product Management', 'JIRA', 'Agile', 'Scrum', 'Analytics', 'UX Research'],
        category: 'Product',
        description: 'BrightFuture is building interactive class tools. As a PM, you will direct the roadmap, synthesize user research, coordinate development sprints, and measure feature success.',
        responsibilities: [
          'Define product requirements and lead sprint planning meetings.',
          'Conduct student/teacher interviews to isolate product friction points.',
          'Analyze user metrics to determine feature engagement rates.',
          'Synchronize alignment between developers, marketing, and executives.'
        ],
        requirements: [
          '3+ years as a Product Manager in a SaaS or EdTech environment.',
          'Familiarity with Agile framework and task orchestration in JIRA.',
          'Data-driven decision maker.'
        ],
        benefits: ['401(k) with 4% match', 'Flexible time off', 'Tuition reimbursement', 'Health savings account contribution']
      },
      {
        title: 'DevOps Engineer',
        company: companies[9]._id, // AeroSpace Next
        location: 'Houston, TX',
        workType: 'On-site',
        experience: 'Mid Level',
        salary: '$115,000 - $140,000',
        skills: ['Docker', 'Jenkins', 'Bash', 'AWS', 'Linux', 'Git'],
        category: 'Engineering',
        description: 'AeroSpace Next is seeking a DevOps engineer to manage launch telemetry servers, automate firmware packaging, and deploy secure AWS interfaces.',
        responsibilities: [
          'Maintain and scale Jenkins continuous integration infrastructure.',
          'Author bash and python scripting to automate hardware builds.',
          'Ensure 99.99% availability of mission data services.',
          'Configure server logs collection using ELK stack.'
        ],
        requirements: [
          'Degree in Aerospace, Mechanical or Computer Engineering.',
          '3+ years deploying AWS services and automating Linux architectures.',
          'Strong scripting proficiency in Python or Bash.'
        ],
        benefits: ['Medical, Dental, Vision', 'Competitive stock grants', 'Space launch viewing opportunities', 'Generous retirement plan']
      },
      {
        title: 'Mobile App Developer (React Native)',
        company: companies[12]._id, // HealthSync Wellness
        location: 'Remote',
        workType: 'Remote',
        experience: 'Mid Level',
        salary: '$95,000 - $120,000',
        skills: ['React Native', 'JavaScript', 'TypeScript', 'iOS', 'Android', 'Redux'],
        category: 'Engineering',
        description: 'Develop custom features for the HealthSync Android/iOS wellness application, integrating Bluetooth fitness bands tracker and custom coaching modules.',
        responsibilities: [
          'Write performant cross-platform mobile components using React Native.',
          'Integrate REST APIs and offline state sync systems.',
          'Optimize application performance to run smoothly on low-spec smartphones.',
          'Manage App Store and Play Store releases.'
        ],
        requirements: [
          '3+ years developing native or hybrid iOS and Android application platforms.',
          'Deep understanding of React hooks, context, and state cycle.',
          'Experience incorporating hardware sensors (GPS, Bluetooth, Accelerometer).'
        ],
        benefits: ['Work from anywhere', 'Fitness tracker stipend ($300/yr)', 'Comprehensive mental health support sessions']
      },
      {
        title: 'Enterprise Sales Representative',
        company: companies[14]._id, // Global Talent Partners
        location: 'London, UK',
        workType: 'Hybrid',
        experience: 'Mid Level',
        salary: '£60,000 - £85,000 (OTE £120k)',
        skills: ['Sales', 'Negotiation', 'Communication', 'CRM', 'Lead Generation'],
        category: 'Sales',
        description: 'Build enterprise clients portfolio, identifying technical staffing needs in large tech firms and closing recruiting service contracts.',
        responsibilities: [
          'Qualify leads and host sales demonstrations for HR heads.',
          'Negotiate complex annual service-level recruiting contracts.',
          'Track customer data pipeline inside Salesforce CRM.',
          'Maintain high client retention rates through advisory services.'
        ],
        requirements: [
          '3+ years B2B software or professional services sales experience.',
          'Strong command of communication, presentation, and contract closing.',
          'High goal alignment.'
        ],
        benefits: ['Uncapped sales commission structure', 'Corporate tech setup (iPhone, Macbook)', '28 days annual leave', 'Private dental care']
      },
      {
        title: 'Growth Marketing Manager',
        company: companies[11]._id, // BlueWater Retail
        location: 'Miami, FL',
        workType: 'Hybrid',
        experience: 'Mid Level',
        salary: '$85,000 - $105,000',
        skills: ['SEO', 'Google Analytics', 'Copywriting', 'E-Commerce', 'Marketing'],
        category: 'Marketing',
        description: 'Design digital user acquisition funnels, targeting e-commerce buyers and building paid ad campaigns.',
        responsibilities: [
          'Organize paid marketing budgets across Facebook, Google, and TikTok ads.',
          'Formulate keyword/SEO content plans to drive organic traffic growth.',
          'Deploy conversion rate optimization (A/B testing) models on checkouts.',
          'Compile monthly analytics reports demonstrating CAC and LTV metrics.'
        ],
        requirements: [
          '3+ years directing digital marketing in an e-commerce context.',
          'Analytical mind with native knowledge of Google Analytics 4.',
          'Creative copywriting abilities.'
        ],
        benefits: ['Product discounts (40% off)', 'Hybrid remote schedule', 'Health insurance package']
      }
    ];

    // Let's generate remaining jobs dynamically to hit 30+ jobs across all categories & companies
    const baseTitles = [
      { title: 'Software Engineer (Backend)', skills: ['Node.js', 'Express', 'PostgreSQL', 'Docker'], category: 'Engineering' },
      { title: 'Data Analyst', skills: ['SQL', 'Excel', 'Tableau', 'Python'], category: 'Data Science' },
      { title: 'Security Engineer (Penetration Tester)', skills: ['Cybersecurity', 'Linux', 'Bash', 'Network Defense'], category: 'Security' },
      { title: 'Product Marketing Executive', skills: ['Marketing', 'SEO', 'Copywriting', 'Social Media'], category: 'Marketing' },
      { title: 'UX Researcher', skills: ['Figma', 'UX Research', 'Prototyping', 'User Interviews'], category: 'Design' },
      { title: 'Scrum Master', skills: ['Agile', 'JIRA', 'Scrum', 'Communication'], category: 'Product' },
      { title: 'Database Administrator', skills: ['MySQL', 'PostgreSQL', 'Redis', 'Linux'], category: 'Engineering' }
    ];

    const jobs = [...rawJobData];

    // Seed remaining jobs (creating 22 more jobs dynamically)
    for (let i = 0; i < 22; i++) {
      const company = companies[i % companies.length];
      const template = baseTitles[i % baseTitles.length];
      const workType = workTypes[i % workTypes.length];
      const exp = experienceLevels[i % experienceLevels.length];
      const randomSalaryVal = 70 + (i * 4);
      
      const category = template.category;

      jobs.push({
        title: `${exp} ${template.title}`,
        company: company._id,
        location: company.location,
        workType,
        experience: exp,
        salary: `$${randomSalaryVal},000 - $${randomSalaryVal + 25},000`,
        skills: template.skills,
        category: category,
        description: `This is a premium ${exp} role at ${company.name}. We are looking for an expert individual with proficiency in ${template.skills.join(', ')} to join our expanding team.`,
        responsibilities: [
          `Execute operational objectives matching the ${template.title} duties.`,
          `Implement high-quality systems utilizing ${template.skills.slice(0,2).join(' and ')}.`,
          'Collaborate across cross-functional engineering and design groups.',
          'Prepare status reports and present outputs to team leads.'
        ],
        requirements: [
          'Bachelor’s degree in Computer Science, Business, or related credentials.',
          `2+ years working with ${template.skills.join(', ')}.`,
          'Strong team collaboration and troubleshooting abilities.'
        ],
        benefits: ['Health and Wellness coverage', 'Flexible hybrid calendar', 'Generous paid time off', 'Company stock options plan'],
        deadline: new Date(Date.now() + (15 + i) * 24 * 60 * 60 * 1000) // deadlines staggered between 15-37 days out
      });
    }

    const createdJobs = [];
    for (const j of jobs) {
      const createdJob = await Job.create(j);
      createdJobs.push(createdJob);
    }
    console.log(`✅ Successfully seeded ${createdJobs.length} Job Openings.`);

    // 5. Create Career Profile for Candidate
    console.log('👤 Seeding Candidate Career Profile...');
    const candidateProfile = await Profile.create({
      user: candidate._id,
      personal: {
        name: 'Alex Rivera',
        email: 'candidate@careerflow.com',
        phone: '+1 (555) 014-9988',
        location: 'San Francisco, CA',
        linkedin: 'https://linkedin.com/in/alexrivera-dev',
        github: 'https://github.com/alexrivera',
        portfolio: 'https://alexrivera.dev',
        photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=60'
      },
      education: [
        {
          degree: 'B.S. in Computer Science',
          college: 'State University College of Engineering',
          university: 'State University',
          startYear: '2018',
          endYear: '2022',
          cgpa: '3.8/4.0'
        }
      ],
      skills: {
        technical: ['REST APIs', 'System Architecture', 'Git', 'Agile Methodologies'],
        programmingLanguages: ['JavaScript', 'TypeScript', 'Python', 'HTML', 'CSS'],
        frameworks: ['React', 'Next.js', 'Express', 'Tailwind CSS', 'Node.js'],
        databases: ['MongoDB', 'PostgreSQL', 'Redis'],
        tools: ['Vite', 'Docker', 'Figma', 'Postman', 'JIRA']
      },
      experience: [
        {
          company: 'TechNovation Labs',
          position: 'Junior Web Developer',
          startDate: 'June 2022',
          endDate: 'Present',
          description: 'Maintained core SaaS application interfaces using React. Improved API responses and database queries, decreasing load times by 20%.'
        }
      ],
      projects: [
        {
          name: 'TaskManager Dash',
          description: 'Collaborative task management dashboard with drag-and-drop support, real-time board updates, and calendar metrics.',
          technologies: ['React', 'Node.js', 'Express', 'MongoDB', 'Tailwind'],
          github: 'https://github.com/alexrivera/task-dash',
          live: 'https://task-dash.netlify.app'
        }
      ],
      certifications: [
        {
          name: 'AWS Certified Cloud Practitioner',
          organization: 'Amazon Web Services (AWS)',
          date: 'February 2023',
          url: 'https://aws.amazon.com/verification'
        }
      ],
      achievements: [
        {
          achievement: 'First Place Winner - City Hackathon 2021',
          organization: 'City Tech Collective',
          date: 'November 2021',
          description: 'Collaborated in a team of 4 to design and build an online resources locator app for low-income citizens.'
        }
      ]
    });

    // 6. Create Resumes (Create 2 initial Resumes)
    console.log('📄 Seeding Candidate Resumes...');
    
    // Copy profile details into Resume Data object format
    const resumeDataObj = {
      personal: {
        name: candidateProfile.personal.name,
        email: candidateProfile.personal.email,
        phone: candidateProfile.personal.phone,
        location: candidateProfile.personal.location,
        linkedin: candidateProfile.personal.linkedin,
        github: candidateProfile.personal.github,
        portfolio: candidateProfile.personal.portfolio,
        summary: 'Enthusiastic and results-driven Software Engineer with 2+ years of experience building modern web applications. Proficient in React, Node, and database design. Eager to solve challenging problems.'
      },
      education: candidateProfile.education,
      skills: candidateProfile.skills,
      experience: candidateProfile.experience,
      projects: candidateProfile.projects,
      certifications: candidateProfile.certifications,
      achievements: candidateProfile.achievements
    };

    const primaryResume = await Resume.create({
      user: candidate._id,
      title: 'Alex Rivera - Software Engineer (Primary)',
      resumeData: resumeDataObj,
      template: 'modern',
      isExtracted: false
    });

    const secondResume = await Resume.create({
      user: candidate._id,
      title: 'Alex Rivera - ATS Format',
      resumeData: resumeDataObj,
      template: 'ats',
      isExtracted: false
    });

    // 7. Create Applications (4 sample applications)
    console.log('📝 Seeding Sample Applications...');
    
    // Application 1: Under Review
    const app1 = await Application.create({
      user: candidate._id,
      job: createdJobs[0]._id, // Apex Tech Frontend Dev
      resume: primaryResume._id,
      status: 'Under Review',
      notes: 'Applied on Tuesday. Sent a follow-up email to recruiter. Tech Stack aligns perfectly.',
      dates: {
        appliedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      }
    });

    // Application 2: Interview
    const app2 = await Application.create({
      user: candidate._id,
      job: createdJobs[1]._id, // Apex Tech Full Stack
      resume: primaryResume._id,
      status: 'Interview',
      notes: 'Passed the screening round! Coding interview is scheduled. Need to practice algorithms.',
      dates: {
        appliedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        interviewDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      }
    });

    // Application 3: Selected (Offer)
    const app3 = await Application.create({
      user: candidate._id,
      job: createdJobs[7]._id, // HealthSync Developer
      resume: secondResume._id,
      status: 'Selected',
      notes: 'Received official offer letter! Reviewing compensation details.',
      dates: {
        appliedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      }
    });

    // Application 4: Applied
    const app4 = await Application.create({
      user: candidate._id,
      job: createdJobs[5]._id, // BrightFuture PM (or other mid level jobs)
      resume: primaryResume._id,
      status: 'Applied',
      notes: 'Applied online. Hoping for a quick feedback.',
      dates: {
        appliedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    });

    // 8. Create Calendar Events
    console.log('📅 Seeding Calendar Events...');
    
    // App 2 interview event
    const compForApp2 = await Company.findById(createdJobs[1].company);
    await Event.create({
      user: candidate._id,
      title: `Interview: Full Stack Engineer at ${compForApp2 ? compForApp2.name : 'Apex Tech'}`,
      type: 'Interview',
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      description: 'Online coding round on Zoom. Topics: Data structures and JavaScript APIs.',
      reminder: true
    });

    // Upcoming deadline event
    await Event.create({
      user: candidate._id,
      title: 'DevOps Job Fair Event',
      type: 'Job fair',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      description: 'Virtual DevOps meet-and-greet event. Register online before joining.',
      reminder: false
    });

    // Another interview
    await Event.create({
      user: candidate._id,
      title: 'UI/UX Design Review Call',
      type: 'Interview',
      date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      description: 'Recruiter call to align on portfolio showcase for Junior UI Designer position.',
      reminder: true
    });

    // 9. Create Notifications
    console.log('🔔 Seeding Notifications...');
    
    await Notification.create({
      user: candidate._id,
      title: 'Interview Scheduled',
      message: `Your coding interview for Full Stack Engineer at ${compForApp2 ? compForApp2.name : 'Apex Tech Solutions'} has been scheduled.`,
      type: 'info',
      isRead: false
    });

    const compForApp3 = await Company.findById(createdJobs[7].company);
    await Notification.create({
      user: candidate._id,
      title: 'Job Offer Received!',
      message: `Congratulations! You have been selected for the Mobile App Developer position at ${compForApp3 ? compForApp3.name : 'HealthSync Wellness'}.`,
      type: 'success',
      isRead: false
    });

    await Notification.create({
      user: candidate._id,
      title: 'Profile Created',
      message: 'Welcome to CareerFlow! Complete your Career Profile to generate automated resumes and apply to jobs.',
      type: 'info',
      isRead: true
    });

    console.log('✅ Seeding complete! Mock login credentials:');
    console.log('👉 ADMIN: admin@careerflow.com / Password123');
    console.log('👉 CANDIDATE: candidate@careerflow.com / Password123');
    
    if (!User.isFallback) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Seeding failed with error:', error);
    process.exit(1);
  }
};

// Check if run directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;
