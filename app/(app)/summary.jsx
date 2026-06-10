import DashboardPageShell from '../../components/dashboard/DashboardPageShell';
import SummaryContent from '../../components/dashboard/SummaryContent';

export default function SummaryScreen() {
  return (
    <DashboardPageShell titleKey="dashboard.summary" roleHintKey="dashboard.tabRoles.summary">
      {(bundle) => <SummaryContent bundle={bundle} />}
    </DashboardPageShell>
  );
}
