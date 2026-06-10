import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import GoalsContent from '../../components/dashboard/GoalsContent';

export default function GoalsScreen() {
  return (
    <DashboardPageShell titleKey="dashboard.goals" sectionId="income">
      {(bundle) => <GoalsContent bundle={bundle} />}
    </DashboardPageShell>
  );
}
