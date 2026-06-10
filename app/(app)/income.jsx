import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import IncomeContent from '../../components/dashboard/IncomeContent';

export default function IncomeScreen() {
  return (
    <DashboardPageShell titleKey="dashboard.income" showSectionEdit={false} roleHintKey="dashboard.tabRoles.income">
      {(bundle) => <IncomeContent bundle={bundle} />}
    </DashboardPageShell>
  );
}
