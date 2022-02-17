variable "STORAGE_ACCOUNT_NAME" {}

resource "azurerm_storage_table" "table" {
  name                 = "functionshuffletable"
  storage_account_name = var.STORAGE_ACCOUNT_NAME
}
