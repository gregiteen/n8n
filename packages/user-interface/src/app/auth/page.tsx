import { PublicOnly } from "@/components/auth"
import { AuthPage } from "@/components/auth"

export default function Auth() {
  return (
    <PublicOnly>
      <AuthPage />
    </PublicOnly>
  )
}
