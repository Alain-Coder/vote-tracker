import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AuthWrapper from './auth-wrapper'
import AdminClient from './admin-client'

export default function AdminPage() {
  return (
    <AuthWrapper>
      <AdminClient />
    </AuthWrapper>
  )
}
