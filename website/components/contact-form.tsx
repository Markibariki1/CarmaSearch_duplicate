"use client"
import { useActionState, useEffect } from "react"
import Image from "next/image"
import { SubmitButton } from "./submit-button"
import { toast } from "@/hooks/use-toast"
import { sendEmail } from "@/app/actions/send-email"

export function ContactForm() {
  async function handleSubmit(formData: FormData) {
    const result = await sendEmail(formData)

    if (result.success) {
      toast({
        title: "Success",
        description: result.success,
      })
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error,
      })
    }
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      <div className="space-y-4">
        <label htmlFor="email" className="block text-lg font-medium text-foreground">
          Email address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="Enter your email"
          required
          className="w-full bg-background border border-border rounded-lg p-4 text-base focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-4">
        <label htmlFor="message" className="block text-lg font-medium text-foreground">
          How can we help?
        </label>
        <textarea
          id="message"
          name="message"
          placeholder="Describe your question or issue..."
          required
          rows={6}
          className="w-full bg-background border border-border rounded-lg p-4 text-base focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-muted-foreground resize-none"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
        <SubmitButton />
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          Powered by
          <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Resend_wordmark_dark-i35Qj7S9FUiAKsOo5C24TYfVgCDrKL.svg"
              alt="Resend"
              width={75}
              height={24}
              className="relative top-[1px]"
            />
          </a>
        </div>
      </div>
    </form>
  )
}
