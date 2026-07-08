import { StatCard } from "@/components/dashboard/StatCard";
import { RecentSales } from "@/components/dashboard/RecentSales";
import { dashboardStats, recentSales } from "@/lib/data";

export default function DashboardPage() {
  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </div>

      <div className="mt-4">
        <RecentSales sales={recentSales} />
      </div>
    </>
  );
}
