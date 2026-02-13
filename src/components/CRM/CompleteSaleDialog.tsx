import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface CompleteSaleDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: CompleteSaleData) => Promise<void>;
  initialCustomerName: string;
}

export interface CompleteSaleData {
  delivery_address: string;
  internal_code: string;
  notes?: string;
}

export const CompleteSaleDialog: React.FC<CompleteSaleDialogProps> = ({
  open,
  onClose,
  onConfirm,
  initialCustomerName,
}) => {
  const [formData, setFormData] = useState<CompleteSaleData>({
    delivery_address: '',
    internal_code: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        delivery_address: '',
        internal_code: '',
        notes: '',
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.delivery_address.trim()) {
      return;
    }

    if (!formData.internal_code.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Finalizar Venda</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="customer_name">Cliente</Label>
            <Input
              id="customer_name"
              value={initialCustomerName}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_address">Endereço de Entrega *</Label>
            <Textarea
              id="delivery_address"
              value={formData.delivery_address}
              onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
              placeholder="Rua, número, bairro, cidade..."
              disabled={submitting}
              required
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="internal_code">Código Interno *</Label>
            <Input
              id="internal_code"
              value={formData.internal_code}
              onChange={(e) => setFormData({ ...formData, internal_code: e.target.value })}
              placeholder="Ex: PED-2024-001"
              disabled={submitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Alguma observação sobre o pedido?"
              disabled={submitting}
              rows={2}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar Venda'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};