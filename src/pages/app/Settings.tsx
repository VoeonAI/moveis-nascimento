const handleConfirmDelete = async () => {
    if (!endpointToDelete) return;
    
    setDeleting(true);
    try {
      await webhooksManagementService.deleteEndpoint(endpointToDelete.id);
      showSuccess("Endpoint excluído com sucesso");
      setDeleteDialogOpen(false);
      setEndpointToDelete(null);
      await loadData();
    } catch (error: any) {
      console.error("[Settings] delete endpoint error", error);
      showError(error.message || "Erro ao excluir endpoint");
    } finally {
      setDeleting(false);
    }
  };