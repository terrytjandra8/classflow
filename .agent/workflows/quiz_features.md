# Quiz Activity Features

The Quiz format is designed for synchronized, real-time classroom competition and assessment.

## 🎓 Teacher Interface (Control Room)
The teacher acts as the "Game Master" for the quiz.

- **Synchronized Flow**: The teacher controls the current question; when the teacher moves to the next slide, every student's screen updates instantly.
- **Question Management**:
  - Multiple Choice Questions (MCQs).
  - Optional image attachments per question.
  - Explanation fields for "Why this answer is correct".
- **Live Monitoring**:
  - View real-time response counts (how many students have answered).
  - Live leaderboard showing student progress/scores.
- **Result Visibility**: Toggle whether students see the correct answer immediately or only after the quiz ends.

## 📱 Student Interface (`StudentGame.tsx`)
A simplified, high-engagement view for participants.

- **Active Participation**: Real-time voting buttons for MCQs.
- **Feedback Loops**: Instant feedback on correctness (if enabled by the teacher).
- **Gamification**: Includes simple animations and status indicators to keep students engaged.
- **Auto-Sync**: No manual refreshing required; the UI reacts to teacher-triggered events via Supabase Realtime.

## 🛠️ Quiz Logic
- **State Management**: Track `quizState` (`setup`, `reading`, `active`, `finished`).
- **Data Integrity**: Scores are calculated and persisted to the `grades` table automatically.
- **Anti-Cheat**: Logic to prevent students from changing their answer once submitted or seeing results before the teacher allows.

---
*Last Updated: April 29, 2026*
