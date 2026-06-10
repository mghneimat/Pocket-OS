import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import ExpensesContent from '../../components/dashboard/ExpensesContent';

export default function CostsScreen() {
  return (
    <DashboardPageShell titleKey="dashboard.expenses" roleHintKey="dashboard.tabRoles.expenses">
      {(bundle) => <ExpensesContent bundle={bundle} />}
    </DashboardPageShell>
  );
}
