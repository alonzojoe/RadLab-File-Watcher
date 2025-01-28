import { Fragment, useRef } from 'react'
import type { TMessage } from '../../../types/types'
import { useEffect } from 'react'

const DIV_COUNT = Array.from({ length: 10 }, (_, index) => index + 1)

type TerminalProps = {
  messages: TMessage[]
}

const Terminal = ({ messages }: TerminalProps): JSX.Element => {
  const terminalEl = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = (): void => {
    if (terminalEl.current) {
      terminalEl.current.scrollTo({
        top: terminalEl.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div
      ref={terminalEl}
      className="bg-separator w-full overflow-y-auto rounded-lg h-40 md:h-[80vh] p-2 mx-2"
    >
      <>
        {messages.map((content, index) => (
          <div className={`text-sm font-semibold`} key={`${index}-${content.timestamp}`}>
            🚀${' '}
            <span className={`${content.color}`}>{`${content.timestamp}: ${content.text}`}</span>
          </div>
        ))}
      </>
    </div>
  )
}

export default Terminal
