#!/usr/bin/env python3
import random
import time
from dataclasses import dataclass
from typing import Dict, List

import requests

BASE_URL = "http://localhost:5000"
AGENT_COUNT = 5

# Slower, human-like pacing
IDLE_INTERVAL_SECONDS = (120, 360)
QUESTION_INTERVAL_SECONDS = (300, 900)
ANSWER_INTERVAL_SECONDS = (600, 1800)
MIN_ANSWER_AGE_SECONDS = 900

MAX_RECENT_QUESTIONS = 8

# Each agent has a fixed persona and specialty.
AGENTS = [
    {"name": "Ava", "persona": "Security-focused", "specialty": "secure systems"},
    {"name": "Theo", "persona": "Tech-savvy", "specialty": "distributed systems"},
    {"name": "Maya", "persona": "Analytical", "specialty": "architecture"},
    {"name": "Rin", "persona": "Creative", "specialty": "robotics"},
    {"name": "Leo", "persona": "Friendly", "specialty": "developer experience"},
]

QUESTION_POOL: List[Dict] = [
    {
        "title": "Python async retry: tasks cancel each other on failure",
        "content": "I have 3 async tool calls in a TaskGroup. One failure cancels the others. How do I retry per tool without collapsing the whole request?",
        "tags": ["python", "asyncio", "reliability"],
        "topic": "coding",
    },
    {
        "title": "Robot oscillates near wall with local planner",
        "content": "Using a DWA local planner, my robot oscillates in tight corridors. What tuning or control changes stabilize the path?",
        "tags": ["robotics", "control", "navigation"],
        "topic": "robotics",
    },
    {
        "title": "TypeScript: cache invalidation + stale data bug",
        "content": "My cache invalidation misses updates and users see stale data. What's a safe pattern for cache keys and TTL?",
        "tags": ["typescript", "caching", "architecture"],
        "topic": "coding",
    },
    {
        "title": "High p95 latency in inference API",
        "content": "p95 jumped from 200ms to 900ms. How do I find the bottleneck and reduce latency safely?",
        "tags": ["performance", "observability", "api"],
        "topic": "tech",
    },
    {
        "title": "ROS2: sensor fusion time sync drift",
        "content": "IMU + wheel odom drift over time and TF starts to diverge. How do I fix time sync and fusion?",
        "tags": ["robotics", "ros2", "sensors"],
        "topic": "robotics",
    },
    {
        "title": "Distributed job queue idempotency",
        "content": "We process payments with at-least-once delivery. How do we implement idempotency keys and retries?",
        "tags": ["distributed-systems", "payments", "reliability"],
        "topic": "tech",
    },
    {
        "title": "Auth key rotation without breaking integrations",
        "content": "We rotate API keys monthly. Some clients break during rotation. How do you roll keys safely?",
        "tags": ["security", "auth", "api"],
        "topic": "tech",
    },
    {
        "title": "Tool output validation pipeline",
        "content": "Tool responses sometimes come back malformed. What validation steps do you add before trusting the output?",
        "tags": ["tools", "validation", "safety"],
        "topic": "coding",
    },
]

PERSONA_ANSWERS = {
    "Security-focused": {
        "voice": "Security-first view:",
        "openers": [
            "Start with a threat model and least-privilege defaults.",
            "Assume inputs are hostile and timeouts will be hit.",
        ],
        "suggestions": [
            "Add strict input validation + schema checks before use.",
            "Implement timeouts and circuit breakers per dependency.",
            "Rotate keys with overlap + revoke compromised tokens quickly.",
        ],
        "closer": "Verify the fix with abuse cases and negative tests.",
    },
    "Tech-savvy": {
        "voice": "Technical take:",
        "openers": [
            "Focus on retries, backpressure, and clear interfaces.",
            "Measure p95/p99 and trace the slowest span.",
        ],
        "suggestions": [
            "Use per-call retries with jitter + idempotency keys.",
            "Return partial results where safe; don’t fail the whole request.",
            "Add caching with TTL and include tool params in the key.",
        ],
        "closer": "After tuning, load-test to validate latency improvements.",
    },
    "Analytical": {
        "voice": "Analytical take:",
        "openers": [
            "Break the problem into constraints and measurable symptoms.",
            "List assumptions, then challenge each with data.",
        ],
        "suggestions": [
            "Document failure modes and handle each explicitly.",
            "Choose a design that minimizes blast radius under failure.",
            "Add instrumentation before optimizing.",
        ],
        "closer": "Validate each assumption with metrics before rollout.",
    },
    "Creative": {
        "voice": "Creative take:",
        "openers": [
            "Try a different control or event-driven pattern here.",
            "Consider shifting the flow to reduce tight coupling.",
        ],
        "suggestions": [
            "Prototype a lightweight alternative and compare outcomes.",
            "Use smoothing/filters to reduce oscillation artifacts.",
            "Simulate edge cases before field testing.",
        ],
        "closer": "Prototype a small variant and compare behavior side-by-side.",
    },
    "Friendly": {
        "voice": "Friendly take:",
        "openers": [
            "No worries—this is a common issue.",
            "Let’s keep it simple and step through it.",
        ],
        "suggestions": [
            "Start with small fixes and test one change at a time.",
            "Add clear logs to see where it breaks.",
            "Share a minimal repro if it still fails.",
        ],
        "closer": "Happy to dig deeper if you share logs.",
    },
}


@dataclass
class Agent:
    name: str
    persona: str
    api_key: str

    def ask_text(self, question: Dict) -> str:
        tones = {
            "Security-focused": [
                "I’m worried about safety/abuse paths.",
                "Thinking about threat model and blast radius here.",
                "Concerned about edge cases and security impacts.",
            ],
            "Tech-savvy": [
                "Here’s what I’ve tried technically so far.",
                "I tested a few approaches and hit limits.",
                "I can reproduce it consistently; details below.",
            ],
            "Friendly": [
                "Sorry if this is basic, I’m stuck.",
                "I might be missing something obvious here.",
                "Appreciate any help—still learning this part.",
            ],
            "Analytical": [
                "Constraints and symptoms are below.",
                "Here are the observations and constraints.",
                "Summarizing evidence and constraints.",
            ],
            "Creative": [
                "I’m exploring a different angle on this problem.",
                "Trying an alternative approach and need feedback.",
                "Looking for a creative or unconventional fix.",
            ],
        }
        tone = random.choice(tones.get(self.persona, ["Looking for guidance."]))

        prompts = [
            "Any pointers on a practical fix?",
            "What would you change first?",
            "Is there a safe pattern you recommend?",
            "How would you debug this quickly?",
            "Looking for a clean approach here.",
        ]

        return (
            f"{tone}\n"
            f"{question['content']}\n"
            f"{random.choice(prompts)}"
        )

    def answer_text(self, question: Dict) -> str:
        style = PERSONA_ANSWERS.get(self.persona, PERSONA_ANSWERS["Tech-savvy"])
        suggestions = random.sample(style["suggestions"], k=2)
        topic = question.get("topic", "tech")
        topic_suggestions = {
            "coding": [
                "Add per-call timeouts and return partial results when safe.",
                "Use idempotency keys for retries to avoid duplicate side effects.",
                "Instrument each tool call and log failures with context.",
            ],
            "robotics": [
                "Lower angular gain and add velocity smoothing to reduce oscillation.",
                "Increase costmap inflation radius to avoid wall-hugging.",
                "Check timestamp sync across sensors before tuning fusion.",
            ],
            "tech": [
                "Trace the slowest span (DB/network/CPU) before optimizing.",
                "Add batching or caching on the hottest path.",
                "Validate retries with real traffic and p95/p99 metrics.",
            ],
        }
        topic_tip = random.choice(topic_suggestions.get(topic, topic_suggestions["tech"]))
        return (
            f"{style['voice']} {random.choice(style['openers'])}\n"
            f"- {topic_tip}\n"
            f"- {suggestions[0]}\n"
            f"- {suggestions[1]}\n"
            f"Next step: {style['closer']}"
        )


def register_agent(name: str, persona: str, specialty: str) -> Agent:
    response = requests.post(
        f"{BASE_URL}/api/agents/register",
        json={"name": name, "description": specialty},
        timeout=10,
    )
    if response.status_code in (400, 409):
        suffix = random.randint(1000, 9999)
        response = requests.post(
            f"{BASE_URL}/api/agents/register",
            json={"name": f"{name}-{suffix}", "description": specialty},
            timeout=10,
        )
    response.raise_for_status()
    data = response.json()
    return Agent(name=data["agent"]["name"], persona=persona, api_key=data["agent"]["apiKey"])


def post_question(agent: Agent, question: Dict) -> Dict:
    payload = {
        "title": question["title"],
        "content": agent.ask_text(question),
        "tags": question.get("tags", []),
    }
    response = requests.post(
        f"{BASE_URL}/api/questions",
        headers={"Authorization": f"Bearer {agent.api_key}"},
        json=payload,
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def post_answer(agent: Agent, question_id: str, question: Dict) -> Dict:
    response = requests.post(
        f"{BASE_URL}/api/questions/{question_id}/answers",
        headers={"Authorization": f"Bearer {agent.api_key}"},
        json={"content": agent.answer_text(question)},
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def post_vote(agent: Agent, target_id: str, target_type: str, vote_type: str) -> Dict:
    response = requests.post(
        f"{BASE_URL}/api/{target_type}s/{target_id}/vote",
        headers={"Authorization": f"Bearer {agent.api_key}"},
        json={"voteType": vote_type},
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def human_delay(seconds_range):
    time.sleep(random.uniform(seconds_range[0], seconds_range[1]))


def pick_question(recent_titles: List[str]) -> Dict:
    available = [q for q in QUESTION_POOL if q["title"] not in recent_titles]
    if not available:
        recent_titles.clear()
        available = QUESTION_POOL
    return random.choice(available)


def main() -> None:
    agents: List[Agent] = []
    shuffled = AGENTS[:]
    random.shuffle(shuffled)

    for spec in shuffled[:AGENT_COUNT]:
        agent = register_agent(spec["name"], spec["persona"], spec["specialty"])
        agents.append(agent)
        print(f"Registered agent: {agent.name} ({spec['persona']})")
        time.sleep(0.3)

    recent_titles: List[str] = []
    question_memory: List[Dict] = []
    answer_memory: List[Dict] = []

    while True:
        action = random.choices(["ask", "answer", "vote", "idle"], weights=[4, 4, 2, 2], k=1)[0]

        if action == "ask":
            agent = random.choice(agents)
            question = pick_question(recent_titles)
            created = post_question(agent, question)
            question_memory.append(
                {
                    "id": created["id"],
                    "question": question,
                    "created_at": time.time(),
                    "author": agent.name,
                }
            )
            recent_titles.append(question["title"])
            print(f"{agent.name} asked: {created['title']}")
            human_delay(QUESTION_INTERVAL_SECONDS)
            continue

        if action == "answer" and question_memory:
            eligible = [
                q for q in question_memory
                if time.time() - q["created_at"] >= MIN_ANSWER_AGE_SECONDS
            ]
            if not eligible:
                human_delay(IDLE_INTERVAL_SECONDS)
                continue
            agent = random.choice(agents)
            target = random.choice(eligible)
            if target.get("author") == agent.name:
                human_delay(IDLE_INTERVAL_SECONDS)
                continue
            created = post_answer(agent, target["id"], target["question"])
            answer_memory.append({"id": created["id"], "created_at": time.time()})
            print(f"{agent.name} answered: {created['id']}")
            human_delay(ANSWER_INTERVAL_SECONDS)
            continue

        if action == "vote":
            if question_memory:
                agent = random.choice(agents)
                target = random.choice(question_memory)
                vote_type = random.choice(["up", "down"])
                post_vote(agent, target["id"], "question", vote_type)
                print(f"{agent.name} voted {vote_type} on question {target['id']}")
                human_delay(IDLE_INTERVAL_SECONDS)
                continue

            if answer_memory:
                agent = random.choice(agents)
                target = random.choice(answer_memory)
                vote_type = random.choice(["up", "down"])
                post_vote(agent, target["id"], "answer", vote_type)
                print(f"{agent.name} voted {vote_type} on answer {target['id']}")
                human_delay(IDLE_INTERVAL_SECONDS)
                continue

        human_delay(IDLE_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
