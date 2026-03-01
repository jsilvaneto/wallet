# Arquitetura do Wallet

## Visão Geral
O projeto segue os princípios de **Clean Architecture** baseada em módulos do NestJS.

### Diretórios Principais (`api/src`)

- **/domain**: (Opcional, caso futuramente queira classes puras). Atualmente entidades são gerenciadas pelo Prisma (`@prisma/client`).
- **/infrastructure**: Comunicação com o mundo exterior (Conexão do Banco de dados com Prisma).
- **/application**: Regras de negócio divididas por domínio (Services, DTOs). 
- **/presentation**: Controladores Web (Rotas e Interceptors, Guards, Filtros Globais).

## Como funciona o fluxo de uma Requisição?

1. Interceptor de log captura a requisição
2. AuthGuard verifica o token JWT.
3. RolesGuard verifica as permissões.
4. Controller recebe o payload e o valida usando os DTOs (`class-validator`).
5. Service executa as regras de negócio puras ou solicitações ao banco de dados.
6. Prisma Service acessa os dados e retorna.
7. O Service retorna para o Controller.
8. Exception Filter lida e formata os erros para um JSON padronizado.
