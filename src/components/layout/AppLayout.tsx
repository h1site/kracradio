import { Outlet } from 'react-router-dom'
import { Sidebar } from '../navigation/Sidebar'
import { Topbar } from '../navigation/Topbar'

export const AppLayout = () => {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-slate-900 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
