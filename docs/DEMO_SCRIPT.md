# Demo Script

## Goal
Show a full user flow from session start to clip sharing with realtime coaching.

## Demo Steps
1. Open landing page `/`.
2. Click `Start Haggling`.
3. Allow microphone and screen-share permissions.
4. Confirm session status is `Active` and realtime is connected.
5. Show automatic screenshot analysis updates every ~2 seconds.
6. Ask Market-Mama a live question in the transcript box:
   - Example: `Mama, this price too high?`
7. Show realtime `MAMA_SPEAK` response and updated suggestion.
8. Highlight UI overlay for suggested action.
9. Show savings meter and confetti pulse.
10. Click `Generate Share Clip`.
11. Wait for clip status progress (`queued -> processing -> ready`).
12. Copy clip link and open:
   - Share on X
   - Share on WhatsApp
   - QR code link
13. Open `/leaderboard` and confirm savings entry updates.

## Backup Plan (If Live AI API Fails)
- Continue demo in fallback mode:
  - Screenshot analysis fallback result still returns products/savings suggestions.
  - Live message fallback still returns coaching text.

## Success Criteria
- No hard failure in session lifecycle.
- Realtime messages continue after temporary connection drops.
- Clip job reaches `ready` and returns URL.
