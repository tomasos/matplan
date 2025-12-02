import { ReactNode, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useHousehold } from '../contexts/HouseholdContext';
import { HouseholdSelector } from './HouseholdSelector';
import { MigrationModal } from './MigrationModal';
import { hasLocalStorageData } from '../utils/migration';

interface ProtectedRouteProps {
  children: ReactNode;
}

const MIGRATION_SHOWN_KEY = 'migrationShown';

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { currentHousehold, loading: householdLoading } = useHousehold();
  const [showMigration, setShowMigration] = useState(false);

  useEffect(() => {
    if (user && currentHousehold && !localStorage.getItem(MIGRATION_SHOWN_KEY)) {
      if (hasLocalStorageData()) {
        setShowMigration(true);
      } else {
        localStorage.setItem(MIGRATION_SHOWN_KEY, 'true');
      }
    }
  }, [user, currentHousehold]);

  const handleMigrationClose = () => {
    setShowMigration(false);
    localStorage.setItem(MIGRATION_SHOWN_KEY, 'true');
  };

  if (authLoading || householdLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="font-regular-16">Laster...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!currentHousehold) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h1 className="font-display-bold-24" style={{ marginBottom: '24px' }}>
          Velg eller opprett husholdning
        </h1>
        <HouseholdSelector />
      </div>
    );
  }

  return (
    <>
      {showMigration && <MigrationModal onClose={handleMigrationClose} />}
      {children}
    </>
  );
}

