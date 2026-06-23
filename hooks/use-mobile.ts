import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Set initial value without triggering the warning since effect runs after initial layout anyway
    const updateMatch = () => setIsMobile(mql.matches)
    updateMatch();
    
    mql.addEventListener("change", updateMatch)
    return () => mql.removeEventListener("change", updateMatch)
  }, [])

  return !!isMobile
}
