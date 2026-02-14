import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';

interface HardDeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  entityType: 'Lead' | 'Pedido';
  entityName?: string;
}

export const HardDeleteConfirmDialog: React.FC<HardDeleteConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  entityType,
  entityName,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = confirmText === 'EXCLUIR';

  const handleClose = () => {
    setConfirmText('');
    setIsSubmitting(false);
    onClose();
  };

  const handleConfirm = async () => {
    if (!isValid) return;
    
    setIsSubmitting(true);
    try {
      await onConfirm();
      handleClose();
    } catch (error) {
      setIsSubmitting(false);
      // Error is handled by the caller via toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={20} />
            Excluir Definitivamente
          </DialogTitle>
          <DialogDescription className="mt-2">
            Esta ação não pode ser desfeita. Todos os dados relacionados serão removidos permanentemente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            <p className="font-semibold">Você está excluindo:</p>
            <p className="mt-1">
              {entityType}: <span className="font-medium">{entityName || 'este item'}</span>
            </p>
            <p className="mt-2 text-xs">
              Isso inclui oportunidades, pedidos, eventos e histórico de timeline associados.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Para confirmar, digite <span className="font-bold bg-gray-100 px-1">EXCLUIR</span> abaixo:
            </label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Digite EXCLUIR"
              disabled={isSubmitting}
              className="uppercase"
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirm}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};