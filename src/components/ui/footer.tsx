import * as React from "react"
import { Github } from "lucide-react"

const Footer = () => {
  return (
    <footer className="w-full border-t bg-background/50 backdrop-blur-sm">
      <div className="container flex items-center justify-between px-4 text-sm">
        <p className="text-muted-foreground">
          In Partner With <a href="Crooked Hook Resort" target="_blank" rel="noopener" className="font-medium underline underline-offset-4 hover:text-primary">Crooked Hook Resort</a>
          <span className="mx-1">•</span>
          Data from <a href="USGS & USSACE" target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-4 hover:text-primary">USACE & USGS</a>
        </p>
        <a
          href="https://crookedhookresort.com"
          target="_blank"
          rel="noopener"
          className="text-muted-foreground hover:text-primary"
        >
          <Github className="h-5 w-5" />
        </a>
      </div>
    </footer>
  )
}

export { Footer }