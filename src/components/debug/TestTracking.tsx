import { trackEvent } from '@/services/funnelTrackingService';
import { Button } from '@/components/ui/button';

/**
 * Componente de teste para debug do tracking
 * Só deve ser usado em desenvolvimento
 */
const TestTracking: React.FC = () => {
  const handleTestInterest = async () => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('[TestTracking] Testing interest_click event');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      await trackEvent('interest_click');
      console.log('[TestTracking] ✅ trackEvent completed');
    } catch (error) {
      console.error('[TestTracking] ❌ Error:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-yellow-100 border-2 border-yellow-500 rounded-lg shadow-xl">
      <h3 className="font-bold text-yellow-900 mb-2">🧪 Debug Tracking</h3>
      <Button 
        onClick={handleTestInterest}
        size="sm"
        variant="default"
        className="bg-blue-600 hover:bg-blue-700 w-full"
      >
        Test Interest Click
      </Button>
      <p className="text-xs text-yellow-800 mt-2">
        Check console for logs
      </p>
      <p className="text-[10px] text-yellow-700 mt-1">
        message_sent is tracked via opportunities table
      </p>
    </div>
  );
};

export default TestTracking;