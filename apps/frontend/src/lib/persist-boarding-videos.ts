import { BOARDING_SKIP_KEY } from '@/lib/boarding-videos'
import { completeBoardingVideos } from '@/services/boarding.service'

export async function persistBoardingVideoProgress() {
  if (typeof window === 'undefined') return
  const skipped = sessionStorage.getItem(BOARDING_SKIP_KEY)
  if (skipped !== '0' && skipped !== '1') return
  try {
    await completeBoardingVideos(skipped === '1')
  } catch {
    // Signup should still succeed if the video flag cannot be stored.
  } finally {
    sessionStorage.removeItem(BOARDING_SKIP_KEY)
  }
}
