export const PROMPT_MODES = {
    "lightning": {
        "initial": `
1. Pattern/Category
2. Key Insight (1 line)
3. Solution Code (Python, clean, optimal)
4. Complexity: T/S

Answer only. No explanation. LeetCode style. Ultra-concise.
`,
        "followup": "See new screenshot. If unchanged, provide previous response."
    },
    "hint": {
        "initial": "Provide a hint as guidance.",
        "followup": "See new screenshot. If unchanged, provide previous response."
    }
}

