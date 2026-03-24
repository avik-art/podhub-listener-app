import type { ToastData } from '@/hooks/useToast'

export default function Toast({ toast }: { toast: ToastData }) {
  return (
    <div className="toast">
      <span style={{ fontSize: 17 }}>{toast.icon}</span>
      <span>{toast.msg}</span>
    </div>
  )
}
