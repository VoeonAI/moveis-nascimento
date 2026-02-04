import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface FinalizeSaleModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: FinalizeSaleData) => Promise<void>;
  leadData: {
    name: string;
    phone?: string;
  };
  productName?: string;
}

export interface FinalizeSaleData {
  customer_name: string;
  customer_phone?: string;
  delivery_address?: string;
  order_number?: string;
  notes?: string;
}

export const FinalizeSaleModal: React.FC<FinalizeSaleModalProps> = ({
  open,
  onClose,
  onConfirm,
  leadData,
  productName,
}) => {
  const [formData, setFormData] = useState<FinalizeSaleData>({
    customer_name: leadData.name,
    customer_phone: leadData.phone || '',
    delivery_address: '',
    order_number: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        customer_name: leadData.name,
        customer_phone: leadData.phone || '',
        delivery_address: '',
        order_number: '',
        notes: '',
      });
    }
  }, [open, leadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_name.trim()) {
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
          <DialogDescription>
            {productName && `Produto: ${productName}`}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="customer_name">Nome do Comprador *</Label>
            <Input
              id="customer_name"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              placeholder="Nome completo"
              disabled={submitting}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer_phone">Telefone</Label>
            <Input
              id="customer_phone"
              value={formData.customer_phone}
              onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              placeholder="(00) 00000-0000"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="delivery_address">Endereço de Entrega</Label>
            <Textarea
              id="delivery_address"
              value={formData.delivery_address}
              onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
              placeholder="Rua, número, bairro, cidade..."
              disabled={submitting}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order_number">Número do Pedido (opcional)</Label>
            <Input
              id="order_number"
              value={formData.order_number}
              onChange={(e) => setFormData({ ...formData, order_number: e.target.value })}
              placeholder="PED-0001"
              disabled={submitting}
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