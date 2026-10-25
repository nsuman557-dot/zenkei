import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { finishAniListLogin } from '../lib/anilist'
import { getProfile } from '../lib/profile'
import { toast } from '../lib/toast'

/** Landing page for the AniList OAuth redirect. */
export default function AniListCallbackPage() {
  const nav = useNavigate()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    document.title = 'Connecting AniList — Zenkai'
    finishAniListLogin(location.hash, getProfile()).then((err) => {
      if (err) toast(err, 'error')
      else toast('AniList connected')
      nav('/profile', { replace: true })
    })
  }, [nav])

  return <main className="grid min-h-[70svh] place-items-center px-4 text-sm text-muted">Connecting to AniList…</main>
}
