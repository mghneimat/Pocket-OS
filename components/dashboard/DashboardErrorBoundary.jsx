import React from 'react';
import { View } from 'react-native';
import { Text } from '@gluestack-ui/themed';
import { C, S, T } from '../../constants/onboarding-theme';
import PrimaryButton from '../ui/PrimaryButton';

export default class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Dashboard render error:', error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    const { error } = this.state;
    const { children, title, body, retryLabel } = this.props;

    if (error) {
      return (
        <View
          style={{
            flex: 1,
            backgroundColor: C.bg,
            alignItems: 'center',
            justifyContent: 'center',
            padding: S.pagePadH,
          }}
        >
          <Text style={{ ...T.questionTitle, fontSize: 22, textAlign: 'center', marginBottom: 12 }}>
            {title}
          </Text>
          <Text style={{ ...T.helper, textAlign: 'center', marginBottom: 24, maxWidth: 320 }}>
            {body}
          </Text>
          <PrimaryButton onPress={this.handleReset}>{retryLabel}</PrimaryButton>
        </View>
      );
    }

    return children;
  }
}
