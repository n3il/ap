import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from '@/components/ui';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/config/supabase';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { useColors } from '@/theme';

function DebugOverlayComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    loading: true,
    connected: false,
    error: null,
    authStatus: null,
    envVars: {},
    testResults: [],
  });
  const {
    colors: palette,
    success,
    error: errorColor,
    warning,
    info,
    withOpacity,
  } = useColors();
  const textPrimary = palette.textPrimary ?? palette.foreground;
  const textSecondary = palette.textSecondary ?? palette.mutedForeground;

  const maskString = (str) => {
    if (!str) return 'NOT SET';
    if (str.length < 10) return '***';
    return `${str.substring(0, 8)}...${str.substring(str.length - 4)}`;
  };

  const runDiagnostics = async () => {
    setConnectionStatus(prev => ({ ...prev, loading: true, testResults: [] }));
    const results = [];

    try {
      // Check environment variables
      const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl ||
                          process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseKey = Constants.expoConfig?.extra?.supabaseAnonKey ||
                          process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

      const envVars = {
        url: supabaseUrl,
        key: supabaseKey,
        urlMasked: maskString(supabaseUrl),
        keyMasked: maskString(supabaseKey),
      };

      results.push({
        test: 'Environment Variables',
        status: supabaseUrl && supabaseKey ? 'pass' : 'fail',
        message: supabaseUrl && supabaseKey
          ? `URL: ${envVars.urlMasked}\nKey: ${envVars.keyMasked}`
          : 'Missing environment variables',
      });

      // Test 1: Check if supabase client is initialized
      if (!supabase) {
        results.push({
          test: 'Supabase Client',
          status: 'fail',
          message: 'Supabase client not initialized',
        });
        setConnectionStatus({
          loading: false,
          connected: false,
          error: 'Supabase client not initialized',
          envVars,
          testResults: results,
        });
        return;
      }

      results.push({
        test: 'Supabase Client',
        status: 'pass',
        message: 'Client initialized successfully',
      });

      // Test 2: Get current session
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          results.push({
            test: 'Auth Session',
            status: 'fail',
            message: `Error: ${sessionError.message}`,
            details: sessionError,
          });
        } else {
          results.push({
            test: 'Auth Session',
            status: 'pass',
            message: sessionData?.session
              ? `User: ${sessionData.session.user?.email || sessionData.session.user?.phone || 'Authenticated'}`
              : 'No active session',
          });
        }
      } catch (err) {
        results.push({
          test: 'Auth Session',
          status: 'fail',
          message: `Exception: ${err.message}`,
        });
      }

      // Test 3: Try a simple database query
      try {
        const { data, error, count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });

        if (error) {
          results.push({
            test: 'Database Connection',
            status: 'fail',
            message: `Error: ${error.message}`,
            details: error,
          });
        } else {
          results.push({
            test: 'Database Connection',
            status: 'pass',
            message: `Connected successfully\nTable 'profiles' accessible (${count ?? 0} rows)`,
          });
        }
      } catch (err) {
        results.push({
          test: 'Database Connection',
          status: 'fail',
          message: `Exception: ${err.message}`,
        });
      }

      // Test 4: Check API key validity
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error && error.message.includes('Invalid API key')) {
          results.push({
            test: 'API Key Validation',
            status: 'fail',
            message: 'Invalid API key - check your .env file',
            details: error,
          });
        } else if (error) {
          results.push({
            test: 'API Key Validation',
            status: 'warning',
            message: `Warning: ${error.message}`,
          });
        } else {
          results.push({
            test: 'API Key Validation',
            status: 'pass',
            message: 'API key is valid',
          });
        }
      } catch (err) {
        results.push({
          test: 'API Key Validation',
          status: 'fail',
          message: `Exception: ${err.message}`,
        });
      }

      // Test 5: WebSocket Connection to Hyperliquid
      try {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            ws?.close();
            reject(new Error('Connection timeout after 10s'));
          }, 10000);

          const ws = new WebSocket('wss://api.hyperliquid.xyz/ws');
          let receivedData = false;

          ws.onopen = () => {
            ws.send(JSON.stringify({
              method: 'subscribe',
              subscription: { type: 'allMids' }
            }));
          };

          ws.onmessage = (event) => {
            try {
              const payload = JSON.parse(event.data);
              if (payload?.channel === 'allMids' && payload?.data) {
                receivedData = true;
                const midsCount = Object.keys(payload.data.mids || {}).length;
                clearTimeout(timeout);
                ws.close();
                results.push({
                  test: 'Hyperliquid WebSocket',
                  status: 'pass',
                  message: `Connected successfully\nReceived ${midsCount} asset prices`,
                  details: { sampleAssets: Object.keys(payload.data.mids || {}).slice(0, 5) }
                });
                resolve();
              }
            } catch (err) {
              clearTimeout(timeout);
              ws.close();
              reject(err);
            }
          };

          ws.onerror = (err) => {
            clearTimeout(timeout);
            reject(new Error('WebSocket connection error'));
          };

          ws.onclose = () => {
            clearTimeout(timeout);
            if (!receivedData) {
              reject(new Error('WebSocket closed without receiving data'));
            }
          };
        });
      } catch (err) {
        results.push({
          test: 'Hyperliquid WebSocket',
          status: 'fail',
          message: `Connection failed: ${err.message}`,
        });
      }

      // Test 6: Check SecureStore contents
      try {
        // Check for chunked storage
        const chunkCount = await SecureStore.getItemAsync('supabase_session_count');
        let sessionData = null;

        if (chunkCount) {
          // Reassemble chunks
          const chunks = [];
          const count = parseInt(chunkCount, 10);

          for (let i = 0; i < count; i++) {
            const chunk = await SecureStore.getItemAsync(`supabase_session_chunk_${i}`);
            if (chunk) chunks.push(chunk);
          }

          sessionData = chunks.join('');
        } else {
          // Try single value (backward compatibility)
          sessionData = await SecureStore.getItemAsync('supabase_session');
        }

        if (sessionData) {
          try {
            const parsed = JSON.parse(sessionData);
            const tokenPreview = parsed.access_token
              ? `${parsed.access_token.substring(0, 10)}...${parsed.access_token.substring(parsed.access_token.length - 10)}`
              : 'No token';

            const expiresAt = parsed.expires_at
              ? new Date(parsed.expires_at * 1000).toLocaleString()
              : 'Unknown';

            const user = parsed.user
              ? (parsed.user.email || parsed.user.phone || 'Unknown')
              : 'No user';

            const storageInfo = chunkCount
              ? `\nStorage: ${chunkCount} chunks (${sessionData.length} bytes)`
              : `\nStorage: Single value (${sessionData.length} bytes)`;

            results.push({
              test: 'SecureStore - Session',
              status: 'pass',
              message: `Session found\nUser: ${user}\nToken: ${tokenPreview}\nExpires: ${expiresAt}${storageInfo}`,
              details: {
                hasAccessToken: !!parsed.access_token,
                hasRefreshToken: !!parsed.refresh_token,
                expiresAt: parsed.expires_at,
                chunked: !!chunkCount,
                chunkCount: chunkCount ? parseInt(chunkCount, 10) : 0,
                totalSize: sessionData.length,
                user: parsed.user ? {
                  id: parsed.user.id,
                  email: parsed.user.email,
                  phone: parsed.user.phone,
                } : null,
              },
            });
          } catch (parseErr) {
            results.push({
              test: 'SecureStore - Session',
              status: 'warning',
              message: `Session data found but malformed\n${sessionData.substring(0, 50)}...`,
            });
          }
        } else {
          results.push({
            test: 'SecureStore - Session',
            status: 'warning',
            message: 'No session data in SecureStore\nUser is not logged in',
          });
        }
      } catch (err) {
        results.push({
          test: 'SecureStore - Session',
          status: 'fail',
          message: `Error reading SecureStore: ${err.message}`,
        });
      }

      const allPassed = results.every(r => r.status === 'pass');
      const hasFailed = results.some(r => r.status === 'fail');

      setConnectionStatus({
        loading: false,
        connected: allPassed,
        error: hasFailed ? 'Some tests failed' : null,
        envVars,
        testResults: results,
      });
    } catch (error) {
      results.push({
        test: 'Overall Diagnostics',
        status: 'fail',
        message: `Fatal error: ${error.message}`,
      });

      setConnectionStatus({
        loading: false,
        connected: false,
        error: error.message,
        envVars: {},
        testResults: results,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  const clearStorage = async () => {
    try {
      // Clear all possible storage keys
      const chunkCount = await SecureStore.getItemAsync('supabase_session_count');

      if (chunkCount) {
        const count = parseInt(chunkCount, 10);
        for (let i = 0; i < count; i++) {
          await SecureStore.deleteItemAsync(`supabase_session_chunk_${i}`);
        }
        await SecureStore.deleteItemAsync('supabase_session_count');
      }

      await SecureStore.deleteItemAsync('supabase_session');
      await supabase.auth.signOut();
      runDiagnostics();
      Alert.alert('Success', 'Storage cleared and signed out');
    } catch (error) {
      Alert.alert('Error', `Failed to clear storage: ${error.message}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass':
        return success;
      case 'fail':
        return errorColor;
      case 'warning':
        return warning;
      default:
        return palette.mutedForeground ?? palette.secondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass': return 'check-circle';
      case 'fail': return 'cancel';
      case 'warning': return 'warning';
      default: return 'help';
    }
  };

  return (
    <>

      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          bottom: 100,
          right: 20,
          width: 30,
          height: 30,
          borderRadius: 28,
          borderWidth: 1,
          borderColor: palette.mutedForeground,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: palette.background,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
          zIndex: 9999,
          opacity: isOpen ? 1 : .4
        }}
      >
        <MaterialIcons
          name={isOpen ? 'close' : 'info-outline'}
          size={16}
          color={isOpen ? errorColor : palette.mutedForeground}
        />
      </TouchableOpacity>


      {isOpen && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: withOpacity(palette.background ?? palette.surface, 0.9),
            zIndex: 9998,
          }}
        >
          <View
            style={{
              flex: 1,
              marginTop: 60,
              marginHorizontal: 20,
              backgroundColor: palette.surfaceSecondary ?? palette.surface,
              borderRadius: 12,
              padding: 16,
            }}
          >

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <MaterialIcons name="bug-report" size={24} color={info} />
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: textPrimary, marginLeft: 8 }}>
                Debug Panel
              </Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={clearStorage} style={{ marginRight: 16 }}>
                <MaterialIcons name="delete" size={24} color={errorColor} />
              </TouchableOpacity>
              <TouchableOpacity onPress={runDiagnostics}>
                <MaterialIcons name="refresh" size={24} color={info} />
              </TouchableOpacity>
            </View>


            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: connectionStatus.connected
                  ? withOpacity(success, 0.5)
                  : withOpacity(errorColor, 0.5),
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              <MaterialIcons
                name={connectionStatus.connected ? 'check-circle' : 'error'}
                size={20}
                color={textPrimary}
              />
              <Text style={{ color: textPrimary, marginLeft: 8, fontWeight: '600' }}>
                {connectionStatus.loading
                  ? 'Running diagnostics...'
                  : connectionStatus.connected
                  ? 'All systems operational'
                  : 'Connection issues detected'}
              </Text>
            </View>


            <ScrollView style={{ flex: 1 }}>
              {connectionStatus.loading && (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={info} />
                  <Text style={{ color: palette.mutedForeground, marginTop: 16 }}>
                    Running diagnostics...
                  </Text>
                </View>
              )}

              {!connectionStatus.loading && connectionStatus.testResults.map((result, index) => (
                <View
                  key={index}
                  style={{
                    backgroundColor: palette.secondary700 ?? palette.surfaceSecondary,
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: getStatusColor(result.status),
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <MaterialIcons
                      name={getStatusIcon(result.status)}
                      size={20}
                      color={getStatusColor(result.status)}
                    />
                    <Text
                      style={{
                        color: textPrimary,
                        fontWeight: '600',
                        marginLeft: 8,
                        flex: 1,
                      }}
                    >
                      {result.test}
                    </Text>
                    <Text
                      style={{
                        color: getStatusColor(result.status),
                        fontSize: 12,
                        fontWeight: '600',
                        textTransform: 'uppercase',
                      }}
                    >
                      {result.status}
                    </Text>
                  </View>

                  <Text style={{ color: textSecondary, fontSize: 14 }}>
                    {result.message}
                  </Text>

                  {result.details && (
                    <View
                      style={{
                        backgroundColor: palette.surfaceSecondary ?? palette.surface,
                        borderRadius: 4,
                        padding: 8,
                        marginTop: 8,
                      }}
                    >
                      <Text style={{ color: palette.mutedForeground, fontSize: 12, fontFamily: 'monospace' }}>
                        {JSON.stringify(result.details, null, 2)}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </>
  );
}

export default function DebugOverlay() {
  if (!true) return null;

  return <DebugOverlayComponent />;
}
