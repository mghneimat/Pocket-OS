import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import BudgetContent from '../../components/dashboard/BudgetContent';

export default function BudgetScreen() {
  return (
    <DashboardPageShell titleKey="dashboard.budget" sectionId="budget" roleHintKey="dashboard.tabRoles.budget">
      {(bundle) => <BudgetContent bundle={bundle} />}
    </DashboardPageShell>
  );
}
