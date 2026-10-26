const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * Extracts raw text from PDF or DOCX file
 */
async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const parsedPdf = await pdfParse(dataBuffer);
    return parsedPdf.text;
  } else if (ext === '.doc' || ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } else {
    throw new Error('Unsupported file extension for parsing.');
  }
}

/**
 * Parses raw text into structured resume fields using heuristics
 */
function parseResumeText(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Initialize structured data template
  const parsedData = {
    personal: {
      name: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      portfolio: '',
      summary: ''
    },
    education: [],
    skills: {
      technical: [],
      programmingLanguages: [],
      frameworks: [],
      databases: [],
      tools: []
    },
    experience: [],
    projects: [],
    certifications: [],
    achievements: []
  };

  if (lines.length === 0) return parsedData;

  // Heuristic 1: Extract Email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = text.match(emailRegex);
  if (emails && emails.length > 0) {
    parsedData.personal.email = emails[0];
  }

  // Heuristic 2: Extract Phone
  const phoneRegex = /(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = text.match(phoneRegex);
  if (phones && phones.length > 0) {
    parsedData.personal.phone = phones[0];
  }

  // Heuristic 3: Extract Links
  const linkedinRegex = /linkedin\.com\/in\/[a-zA-Z0-9_-]+/gi;
  const githubRegex = /github\.com\/[a-zA-Z0-9_-]+/gi;
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

  const linkedins = text.match(linkedinRegex);
  if (linkedins && linkedins.length > 0) {
    parsedData.personal.linkedin = 'https://' + linkedins[0];
  }
  const githubs = text.match(githubRegex);
  if (githubs && githubs.length > 0) {
    parsedData.personal.github = 'https://' + githubs[0];
  }
  const urls = text.match(urlRegex);
  if (urls) {
    const portfolioUrl = urls.find(url => !url.includes('linkedin.com') && !url.includes('github.com'));
    if (portfolioUrl) {
      parsedData.personal.portfolio = portfolioUrl;
    }
  }

  // Heuristic 4: Guess Name
  // Usually, the first line containing 2-3 words (no numbers or symbols) at the top is the name.
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    const wordCount = line.split(/\s+/).length;
    if (wordCount >= 2 && wordCount <= 4 && !/\d/.test(line) && !line.includes('@') && !line.includes('/') && !line.includes(':')) {
      parsedData.personal.name = line;
      break;
    }
  }
  // Fallback name if still blank
  if (!parsedData.personal.name && parsedData.personal.email) {
    parsedData.personal.name = parsedData.personal.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  // Identify Section Indices
  const sectionHeaders = {
    summary: /summary|objective|profile|about me/i,
    skills: /skills|technical skills|technologies|expertise|programming languages/i,
    education: /education|academic background|studies/i,
    experience: /experience|work experience|employment history|work history/i,
    projects: /projects|academic projects|personal projects/i,
    certifications: /certifications|credentials|licenses/i,
    achievements: /achievements|awards|honors/i
  };

  const sectionsFound = [];
  lines.forEach((line, idx) => {
    // Look for short lines that match section headers
    if (line.length < 35) {
      for (const section in sectionHeaders) {
        if (sectionHeaders[section].test(line)) {
          sectionsFound.push({ section, lineIdx: idx, name: line });
          break;
        }
      }
    }
  });

  // Sort sections by index
  sectionsFound.sort((a, b) => a.lineIdx - b.lineIdx);

  // Extract content between sections
  for (let i = 0; i < sectionsFound.length; i++) {
    const current = sectionsFound[i];
    const nextIdx = (i + 1 < sectionsFound.length) ? sectionsFound[i+1].lineIdx : lines.length;
    const sectionLines = lines.slice(current.lineIdx + 1, nextIdx);

    const sectionContentText = sectionLines.join(' ');

    if (current.section === 'summary') {
      parsedData.personal.summary = sectionContentText;
    } 
    else if (current.section === 'skills') {
      // Analyze section lines to classify skills
      const skillKeywords = {
        programmingLanguages: ['javascript', 'typescript', 'python', 'java', 'c++', 'go', 'rust', 'ruby', 'php', 'swift', 'html', 'css', 'sql', 'bash', 'kotlin'],
        frameworks: ['react', 'angular', 'vue', 'next.js', 'express', 'spring', 'django', 'flask', 'laravel', 'asp.net', 'nestjs', 'tailwind', 'bootstrap', 'vuejs', 'reactjs', 'expressjs'],
        databases: ['mongodb', 'postgresql', 'mysql', 'sqlite', 'redis', 'oracle', 'dynamodb', 'firebase', 'cassandra', 'mariadb'],
        tools: ['git', 'github', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'jenkins', 'ci/cd', 'jira', 'postman', 'figma', 'webpack', 'vite', 'heroku']
      };

      // Split by commas, semicolons, bullets or spaces
      const words = text.toLowerCase().split(/[\s,;|•·\(\)]+/).map(w => w.trim()).filter(w => w.length > 1);
      
      const foundSkillsSet = new Set();
      
      // Match words against predefined categories
      words.forEach(word => {
        for (const category in skillKeywords) {
          if (skillKeywords[category].includes(word)) {
            const displayWord = word.charAt(0).toUpperCase() + word.slice(1);
            if (!parsedData.skills[category].includes(displayWord)) {
              parsedData.skills[category].push(displayWord);
              foundSkillsSet.add(displayWord);
            }
          }
        }
      });
      
      // Any remaining words from the Skills section that aren't categorized can go to technical
      sectionLines.forEach(l => {
        const parts = l.split(/[,;|•·]+/).map(p => p.trim()).filter(p => p.length > 2);
        parts.forEach(part => {
          // If it matches a list item and is not already in categorised arrays, add it to technical
          if (part.length < 25 && !foundSkillsSet.has(part)) {
            parsedData.skills.technical.push(part);
          }
        });
      });
      // Limit arrays length to avoid cluttering
      parsedData.skills.technical = [...new Set(parsedData.skills.technical)].slice(0, 10);
    } 
    else if (current.section === 'education') {
      // Parse individual lines
      let currentEd = null;
      sectionLines.forEach(l => {
        const degreeRegex = /(b\.?tech|b\.?s\.?c|m\.?tech|b\.?e\.?|m\.?s\.?|m\.?b\.?a|ph\.?d|bachelor|master|diploma|school)/i;
        const yearRegex = /\b(19|20)\d{2}\b/g;
        
        if (degreeRegex.test(l)) {
          if (currentEd) parsedData.education.push(currentEd);
          
          const degrees = l.match(degreeRegex);
          const years = l.match(yearRegex) || [];
          
          currentEd = {
            degree: degrees[0].toUpperCase(),
            college: l.split(',')[0] || 'College/University',
            university: l.split(',')[1] || '',
            startYear: years[0] || '2020',
            endYear: years[1] || years[0] || '2024',
            cgpa: l.match(/\b\d\.\d\b/) ? l.match(/\b\d\.\d\b/)[0] : '8.0'
          };
        } else if (currentEd) {
          // Supplementary line details
          if (l.includes('%') || l.match(/\b\d\.\d\b/)) {
            currentEd.cgpa = l.match(/\b\d\.\d\b/) ? l.match(/\b\d\.\d\b/)[0] : l.trim();
          } else if (currentEd.university === '') {
            currentEd.university = l;
          }
        }
      });
      if (currentEd) parsedData.education.push(currentEd);
    } 
    else if (current.section === 'experience') {
      let currentExp = null;
      sectionLines.forEach(l => {
        const yearRegex = /\b(19|20)\d{2}\b/g;
        // Simple indicator for job titles / positions
        const positionKeywords = /(developer|engineer|manager|analyst|intern|lead|consultant|designer|specialist)/i;
        
        if (positionKeywords.test(l) && l.length < 50) {
          if (currentExp) parsedData.experience.push(currentExp);
          
          const years = l.match(yearRegex) || [];
          currentExp = {
            company: 'Company Name',
            position: l.trim(),
            startDate: years[0] || '2022',
            endDate: years[1] || 'Present',
            description: ''
          };
        } else if (currentExp) {
          if (yearRegex.test(l) && currentExp.startDate === '2022') {
            const years = l.match(yearRegex);
            currentExp.startDate = years[0];
            currentExp.endDate = years[1] || 'Present';
          } else {
            currentExp.description += (currentExp.description ? '\n' : '') + l;
          }
        }
      });
      if (currentExp) parsedData.experience.push(currentExp);
    } 
    else if (current.section === 'projects') {
      let currentProj = null;
      sectionLines.forEach(l => {
        if (l.length < 40 && !l.includes(' ') && (l.includes('http') || l.includes('github'))) {
          if (currentProj) currentProj.github = l;
        } else if (l.length < 40 && !/\d/.test(l) && l.split(' ').length < 5) {
          if (currentProj) parsedData.projects.push(currentProj);
          currentProj = {
            name: l.trim(),
            description: '',
            technologies: [],
            github: '',
            live: ''
          };
        } else if (currentProj) {
          currentProj.description += (currentProj.description ? '\n' : '') + l;
        }
      });
      if (currentProj) parsedData.projects.push(currentProj);
    }
    else if (current.section === 'certifications') {
      sectionLines.forEach(l => {
        if (l.length < 60 && l.length > 5) {
          parsedData.certifications.push({
            name: l.trim(),
            organization: 'Issuing Organization',
            date: '2023',
            url: ''
          });
        }
      });
    }
    else if (current.section === 'achievements') {
      sectionLines.forEach(l => {
        if (l.length < 80 && l.length > 5) {
          parsedData.achievements.push({
            achievement: l.trim(),
            organization: 'Award Organization',
            date: '2023',
            description: ''
          });
        }
      });
    }
  }

  // Populate placeholder structures if parsing is empty to guarantee a valid output structure
  if (parsedData.education.length === 0) {
    parsedData.education.push({ degree: 'Degree', college: 'College', university: 'University', startYear: '2020', endYear: '2024', cgpa: '8.5' });
  }
  if (parsedData.experience.length === 0) {
    parsedData.experience.push({ company: 'Company', position: 'Software Engineer', startDate: '2022', endDate: 'Present', description: 'Developed React web applications.' });
  }
  
  return parsedData;
}

module.exports = {
  extractTextFromFile,
  parseResumeText
};
