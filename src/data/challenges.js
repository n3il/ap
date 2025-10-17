// Daily coding challenges
export const challenges = [
  {
    id: 1,
    date: '2025-01-22',
    title: 'Two Sum',
    difficulty: 'Easy',
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
      },
      {
        input: 'nums = [3,3], target = 6',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 6, we return [0, 1].',
      },
    ],
    constraints: [
      '2 <= nums.length <= 10⁴',
      '-10⁹ <= nums[i] <= 10⁹',
      '-10⁹ <= target <= 10⁹',
      'Only one valid answer exists.',
    ],
    hints: [
      'A really brute force way would be to search for all possible pairs of numbers but that would be too slow. Again, it\'s best to try out brute force solutions for just for completeness. It is from these brute force solutions that you can come up with optimizations.',
      'So, if we fix one of the numbers, say x, we have to scan the entire array to find the next number y which is value - x where value is the input parameter. Can we change our array somehow so that this search becomes faster?',
      'The second train of thought is, without changing the array, can we use additional space somehow? Like maybe a hash map to speed up the search?',
    ],
    topics: ['Array', 'Hash Table'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Apple', 'Facebook'],
    acceptanceRate: 49.2,
    submissions: 15234567,
    accepted: 7495229,
  },
  {
    id: 2,
    date: '2025-01-23',
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    description: 'Given the `head` of a singly linked list, reverse the list, and return the reversed list.',
    examples: [
      {
        input: 'head = [1,2,3,4,5]',
        output: '[5,4,3,2,1]',
        explanation: 'The linked list is reversed from [1->2->3->4->5] to [5->4->3->2->1].',
      },
      {
        input: 'head = [1,2]',
        output: '[2,1]',
        explanation: 'The linked list is reversed from [1->2] to [2->1].',
      },
      {
        input: 'head = []',
        output: '[]',
        explanation: 'An empty list remains empty after reversal.',
      },
    ],
    constraints: [
      'The number of nodes in the list is the range [0, 5000].',
      '-5000 <= Node.val <= 5000',
    ],
    hints: [
      'Can you solve it iteratively and recursively?',
    ],
    topics: ['Linked List', 'Recursion'],
    companies: ['Amazon', 'Microsoft', 'Apple', 'Bloomberg', 'Adobe'],
    acceptanceRate: 73.8,
    submissions: 8234567,
    accepted: 6077222,
  },
  {
    id: 3,
    date: '2025-01-24',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    description: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
    examples: [
      {
        input: 's = "()"',
        output: 'true',
        explanation: 'The string contains valid parentheses.',
      },
      {
        input: 's = "()[]{}"',
        output: 'true',
        explanation: 'All brackets are properly closed in order.',
      },
      {
        input: 's = "(]"',
        output: 'false',
        explanation: 'Mismatched bracket types.',
      },
    ],
    constraints: [
      '1 <= s.length <= 10⁴',
      's consists of parentheses only \'()[]{}\'.',
    ],
    hints: [
      'Use a stack data structure to keep track of opening brackets.',
      'When you encounter a closing bracket, check if it matches the most recent opening bracket.',
    ],
    topics: ['String', 'Stack'],
    companies: ['Google', 'Amazon', 'Facebook', 'Microsoft', 'Bloomberg'],
    acceptanceRate: 40.5,
    submissions: 12345678,
    accepted: 5000000,
  },
  {
    id: 4,
    date: '2025-01-25',
    title: 'Merge Two Sorted Lists',
    difficulty: 'Easy',
    description: 'You are given the heads of two sorted linked lists `list1` and `list2`.\n\nMerge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.\n\nReturn the head of the merged linked list.',
    examples: [
      {
        input: 'list1 = [1,2,4], list2 = [1,3,4]',
        output: '[1,1,2,3,4,4]',
        explanation: 'The merged list is sorted.',
      },
      {
        input: 'list1 = [], list2 = []',
        output: '[]',
        explanation: 'Both lists are empty.',
      },
      {
        input: 'list1 = [], list2 = [0]',
        output: '[0]',
        explanation: 'One list is empty, return the other.',
      },
    ],
    constraints: [
      'The number of nodes in both lists is in the range [0, 50].',
      '-100 <= Node.val <= 100',
      'Both list1 and list2 are sorted in non-decreasing order.',
    ],
    hints: [
      'You can solve this problem using iterative or recursive approaches.',
      'Keep track of the current position in both lists and compare values.',
    ],
    topics: ['Linked List', 'Recursion'],
    companies: ['Amazon', 'Microsoft', 'Apple', 'Adobe', 'Google'],
    acceptanceRate: 62.1,
    submissions: 7234567,
    accepted: 4492760,
  },
  {
    id: 5,
    date: '2025-01-26',
    title: 'Maximum Subarray',
    difficulty: 'Medium',
    description: 'Given an integer array `nums`, find the subarray with the largest sum, and return its sum.',
    examples: [
      {
        input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
        output: '6',
        explanation: 'The subarray [4,-1,2,1] has the largest sum 6.',
      },
      {
        input: 'nums = [1]',
        output: '1',
        explanation: 'The subarray [1] has the largest sum 1.',
      },
      {
        input: 'nums = [5,4,-1,7,8]',
        output: '23',
        explanation: 'The subarray [5,4,-1,7,8] has the largest sum 23.',
      },
    ],
    constraints: [
      '1 <= nums.length <= 10⁵',
      '-10⁴ <= nums[i] <= 10⁴',
    ],
    hints: [
      'Think about dynamic programming or Kadane\'s algorithm.',
      'Keep track of the maximum sum ending at the current position.',
    ],
    topics: ['Array', 'Dynamic Programming', 'Divide and Conquer'],
    companies: ['Amazon', 'Google', 'Microsoft', 'Apple', 'Bloomberg'],
    acceptanceRate: 50.3,
    submissions: 9876543,
    accepted: 4967789,
  },
];

// Get today's challenge based on date
export const getTodaysChallenge = () => {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
  const challengeIndex = dayOfYear % challenges.length;
  return challenges[challengeIndex];
};

// Get challenge by ID
export const getChallengeById = (id) => {
  return challenges.find(c => c.id === id);
};
