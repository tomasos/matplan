import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { HouseholdProvider } from './contexts/HouseholdContext';
import { MealsProvider } from './contexts/MealsContext';
import { WeekPlanProvider } from './contexts/WeekPlanContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ShoppingListProvider } from './contexts/ShoppingListContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { WeekPlanner } from './views/WeekPlanner';
import { MealList } from './views/MealList';
import { AddMeal } from './views/AddMeal';
import { Desktop } from './views/Desktop';
import { Settings } from './views/Settings';
import { ShoppingList } from './views/ShoppingList';
import { Login } from './views/Login';


function App() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isDesktop) {
    return (
      <AuthProvider>
        <HouseholdProvider>
          <MealsProvider>
            <WeekPlanProvider>
              <SettingsProvider>
                <ShoppingListProvider>
                  <BrowserRouter>
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/auth/callback" element={<Login />} />
                      <Route
                        path="/"
                        element={
                          <ProtectedRoute>
                            <Desktop />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/add-meal"
                        element={
                          <ProtectedRoute>
                            <AddMeal />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="*"
                        element={
                          <ProtectedRoute>
                            <Desktop />
                          </ProtectedRoute>
                        }
                      />
                    </Routes>
                  </BrowserRouter>
                </ShoppingListProvider>
              </SettingsProvider>
            </WeekPlanProvider>
          </MealsProvider>
        </HouseholdProvider>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <HouseholdProvider>
        <MealsProvider>
          <WeekPlanProvider>
            <SettingsProvider>
              <ShoppingListProvider>
                <BrowserRouter>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/auth/callback" element={<Login />} />
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <WeekPlanner />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/meals"
                      element={
                        <ProtectedRoute>
                          <MealList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/add-meal"
                      element={
                        <ProtectedRoute>
                          <AddMeal />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/shopping"
                      element={
                        <ProtectedRoute>
                          <ShoppingList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </BrowserRouter>
              </ShoppingListProvider>
            </SettingsProvider>
          </WeekPlanProvider>
        </MealsProvider>
      </HouseholdProvider>
    </AuthProvider>
  );
}

export default App;

