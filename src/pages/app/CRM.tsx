const LeadContextCard = ({ lead, lastOpportunity, lastMessage, storeWhatsApp }: {
  lead: Lead;
  lastOpportunity?: Opportunity & { products?: { id: string; name: string } };
  lastMessage?: string;
  storeWhatsApp: string | null;
}) => {
  const openWhatsApp = () => {
    const phone = lead.phone?.replace(/\D/g, '');
    const lastInterestProductName = lastOpportunity?.products?.name || 'Móveis Nascimento';

    const message = `Olá ${lead.name}, tudo bem?

Aqui é da Móveis Nascimento.

Vi que você demonstrou interesse no produto:

"${lastInterestProductName}"

Posso te ajudar com valores ou condições?`;

    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
      '_blank'
    );
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            {lastOpportunity?.products && (
              <div className="flex items-center gap-2">
                <Package size={16} className="text-green-600" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Último Interesse</p>
                  <p className="font-semibold text-gray-900">{lastOpportunity.products.name}</p>
                </div>
              </div>
            )}
            
            {lastMessage && (
              <div className="flex items-start gap-2">
                <MessageSquare size={16} className="text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Última Mensagem</p>
                  <p className="text-sm text-gray-700 line-clamp-2">{lastMessage}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Clock size={16} className="text-gray-500" />
              <p className="text-xs text-gray-500">
                Interesse em {lastOpportunity ? format(new Date(lastOpportunity.created_at), 'dd/MM/yyyy') : '-'}
              </p>
            </div>
          </div>

          {lead.phone && (
            <Button
              onClick={openWhatsApp}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <MessageCircle size={20} className="mr-2" />
              Abrir WhatsApp
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};