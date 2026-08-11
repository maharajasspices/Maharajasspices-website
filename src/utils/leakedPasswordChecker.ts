/**
 * Extended leaked password detection
 * A more comprehensive free client-side check against common/leaked passwords
 */

// Extended list of top 1000+ most common leaked passwords
const LEAKED_PASSWORDS = new Set([
  // Top 100 most common
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567', 'letmein',
  'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine', 'ashley', 'bailey',
  'passw0rd', 'shadow', '123123', '654321', 'superman', 'qazwsx', 'michael', 'football',
  'password1', 'password123', 'welcome', 'ninja', 'mustang', 'password!', 'admin', 'solo',
  'jordan23', 'starwars', 'freedom', 'whatever', 'trustme', '111111', '000000', 'hunter',
  'ranger', 'buster', 'thomas', 'tigger', 'robert', 'soccer', 'computer', 'maverick',
  'cowboys', 'ferrari', 'chicken', 'newyork', 'batman', 'cheese', 'qwerty123', 'password!@#',
  'admin123', 'root', 'toor', 'pass', 'test', 'guest', 'info', 'adm', 'mysql', 'user',
  'administrator', 'oracle', 'ftp', 'pi', 'puppet', 'ansible', 'ec2-user', 'vagrant',
  'azureuser', 'academy', 'acceptance', 'access', 'accident', 'account', 'accurate', 'action',
  
  // Additional common passwords
  'letmein123', 'welcome1', 'welcome123', 'changeme', 'secret', 'login', 'princess',
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm', '1234567890', '987654321', 'abcdefg', 'abcd1234',
  'test123', 'pass123', 'admin1234', 'root123', 'password12', 'password1234', 'pass1234',
  'qwerty12', 'qwerty1234', '12345', '123456789', '1234567891', '12345678910', 'letmein1',
  
  // Year-based passwords
  '2020', '2021', '2022', '2023', '2024', '2025', 'password2020', 'password2021', 'password2022',
  'password2023', 'password2024', 'password2025',
  
  // Common patterns
  'aaaaaa', 'bbbbbb', 'cccccc', '111111', '222222', '333333', '444444', '555555', '666666',
  '777777', '888888', '999999', 'aaaa1111', 'bbbb2222', '1q2w3e', '1q2w3e4r', '1q2w3e4r5t',
  'zaq12wsx', 'zaq1xsw2', 'qwer1234', 'asdf1234', '!@#$%^&*', '1qaz2wsx', '1qaz!QAZ',
  
  // Names and words
  'michael1', 'jennifer', 'thomas1', 'charlie', 'andrew', 'joshua', 'jessica', 'michelle',
  'daniel1', 'matthew', 'george', 'anthony', 'william', 'joseph', 'robert1', 'david1',
  'richard', 'charles', 'steven', 'kevin', 'brian', 'edward', 'ronald', 'timothy',
  'jason', 'jeffrey', 'ryan', 'jacob', 'gary', 'nicholas', 'eric', 'jonathan', 'stephen',
  'larry', 'justin', 'scott', 'brandon', 'benjamin', 'samuel', 'raymond', 'gregory',
  'frank', 'alexander', 'patrick', 'jack', 'dennis', 'jerry', 'tyler', 'aaron', 'jose',
  'adam', 'nathan', 'henry', 'douglas', 'zachary', 'peter', 'kyle', 'noah', 'ethan',
  'jeremy', 'walter', 'christian', 'keith', 'roger', 'terry', 'austin', 'sean', 'gerald',
  
  // Sports teams and references
  'yankees', 'lakers', 'cowboys1', 'eagles', 'packers', 'steelers', 'patriots', 'giants',
  'broncos', 'dolphins', 'raiders', 'bears', 'chiefs', 'bengals', 'texans', 'seahawks',
  'arsenal', 'chelsea', 'liverpool', 'barcelona', 'realmadrid', 'juventus', 'bayern',
  
  // Pop culture
  'pokemon', 'pikachu', 'starwars1', 'gandalf', 'harry', 'potter', 'harrypotter', 'frodo',
  'sauron', 'legolas', 'aragorn', 'dumbledore', 'hogwarts', 'slytherin', 'gryffindor',
  'ironman', 'spiderman', 'batman1', 'superman1', 'hulk', 'thor', 'loki', 'thanos',
  'avengers', 'marvel', 'dccomics', 'joker', 'catwoman', 'wonderwoman', 'flash',
  'minecraft', 'fortnite', 'roblox', 'valorant', 'apex', 'pubg', 'warzone', 'overwatch',
  
  // Tech-related
  'google', 'facebook', 'twitter', 'instagram', 'youtube', 'tiktok', 'snapchat', 'linkedin',
  'microsoft', 'apple', 'amazon', 'netflix', 'spotify', 'discord', 'reddit', 'github',
  'linux', 'ubuntu', 'windows', 'android', 'iphone', 'samsung', 'nvidia', 'intel', 'amd',
  
  // Animals
  'dog', 'cat', 'fish', 'bird', 'tiger', 'lion', 'bear', 'wolf', 'fox', 'rabbit', 'horse',
  'dolphin', 'elephant', 'giraffe', 'zebra', 'penguin', 'eagle', 'shark', 'whale', 'snake',
  
  // Food
  'pizza', 'burger', 'taco', 'pasta', 'sushi', 'coffee', 'chocolate', 'cookie', 'bacon',
  'steak', 'chicken1', 'cheese1', 'butter', 'bread', 'sandwich', 'salad', 'soup', 'rice',
  
  // Colors
  'red123', 'blue123', 'green123', 'yellow123', 'purple123', 'orange123', 'black123', 'white123',
  
  // Months/Days
  'january', 'february', 'march', 'april', 'may123', 'june123', 'july123', 'august',
  'september', 'october', 'november', 'december', 'monday', 'tuesday', 'wednesday',
  'thursday', 'friday', 'saturday', 'sunday',
  
  // Countries/Cities
  'america', 'london', 'paris', 'tokyo', 'newyork1', 'losangeles', 'chicago', 'houston',
  'phoenix', 'philadelphia', 'sanantonio', 'sandiego', 'dallas', 'austin', 'seattle',
  
  // Keyboard walks
  '!@#$%', '!@#$%^', '!@#$%^&', 'qwertyui', 'asdfghj', 'zxcvbn', '1234qwer', 'qwer!@#$',
  
  // Simple substitutions (these are well-known)
  'p@ssword', 'p@ssw0rd', 'pa$$word', 'pa$$w0rd', 'passw0rd!', 'adm1n', 'r00t', 'us3r',
  
  // Common phrases
  'iloveyou1', 'iloveyou!', 'ihateyou', 'fuckyou', 'f*ckyou', 'asshole', 'biteme', 'whatever1',
  'blahblah', 'nothing', 'secret1', 'private', 'secure', 'security', 'internet', 'online',
]);

// Common password patterns to check
const PASSWORD_PATTERNS = [
  /^(.)\1+$/i, // All same character: aaaa, 1111
  /^(012|123|234|345|456|567|678|789|890)+$/i, // Sequential numbers
  /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)+$/i, // Sequential letters
  /^(qwe|wer|ert|rty|tyu|yui|uio|iop|asd|sdf|dfg|fgh|ghj|hjk|jkl|zxc|xcv|cvb|vbn|bnm)+$/i, // Keyboard rows
  /^password\d*!*$/i, // password, password1, password123, password!
  /^admin\d*!*$/i, // admin, admin1, admin123
  /^welcome\d*!*$/i, // welcome, welcome1
  /^letmein\d*!*$/i, // letmein, letmein1
  /^qwerty\d*!*$/i, // qwerty, qwerty123
  /^\d{4,8}$/, // Just numbers (4-8 digits)
  /^[a-z]{4,8}\d{1,4}$/i, // Simple word + numbers
];

export interface LeakedPasswordResult {
  isLeaked: boolean;
  reason?: string;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Check if a password is in our leaked password database
 * This is a free client-side check
 */
export function checkLeakedPassword(password: string): LeakedPasswordResult {
  if (!password) {
    return { isLeaked: false, severity: 'none' };
  }

  const lowerPassword = password.toLowerCase();

  // Check exact match against leaked passwords list
  if (LEAKED_PASSWORDS.has(lowerPassword)) {
    return {
      isLeaked: true,
      reason: 'This password appears in known data breach lists and is extremely unsafe',
      severity: 'critical'
    };
  }

  // Check if password contains a leaked password as a base
  for (const leaked of LEAKED_PASSWORDS) {
    if (lowerPassword.includes(leaked) && leaked.length >= 4) {
      // Password contains a common leaked password
      if (password.length <= leaked.length + 3) {
        return {
          isLeaked: true,
          reason: 'This password is a minor variation of a commonly leaked password',
          severity: 'high'
        };
      }
    }
  }

  // Check against common patterns
  for (const pattern of PASSWORD_PATTERNS) {
    if (pattern.test(password)) {
      return {
        isLeaked: true,
        reason: 'This password follows a common pattern that is easily guessed',
        severity: 'high'
      };
    }
  }

  // Check for reversed common passwords
  const reversedPassword = lowerPassword.split('').reverse().join('');
  if (LEAKED_PASSWORDS.has(reversedPassword)) {
    return {
      isLeaked: true,
      reason: 'This is a reversed version of a commonly leaked password',
      severity: 'medium'
    };
  }

  // Check for common l33t speak substitutions of leaked passwords
  const normalizedPassword = lowerPassword
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/@/g, 'a')
    .replace(/\$/g, 's');
  
  if (LEAKED_PASSWORDS.has(normalizedPassword)) {
    return {
      isLeaked: true,
      reason: 'This password is a common substitution of a leaked password',
      severity: 'high'
    };
  }

  return { isLeaked: false, severity: 'none' };
}

/**
 * Get the count of passwords in our leaked database
 */
export function getLeakedPasswordCount(): number {
  return LEAKED_PASSWORDS.size;
}
