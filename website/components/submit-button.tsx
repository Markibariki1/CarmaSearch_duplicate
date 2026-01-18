"use client"
import { ArrowRight, Loader2 } from "lucide-react"
import { useFormStatus } from "react-dom"

export function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-white/20 backdrop-blur-sm border border-white/20 hover:bg-white/30 text-white font-medium rounded-2xl h-14 px-8 text-base inline-flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:hover:bg-white/20 disabled:transform-none min-w-[180px] w-full sm:w-auto"
    >
      {pending ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          <span>Send Message</span>
          <ArrowRight className="w-5 h-5" />
        </>
      )}
    </button>
  )
}
