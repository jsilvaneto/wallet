import asyncio
from app.database import AsyncSessionLocal
from app.services.google_sheets_service import check_sync_pending_status

async def test_status():
    async with AsyncSessionLocal() as session:
        status_res = await check_sync_pending_status(session, check_remote=False)
        print("Status Res:", status_res.model_dump())
        assert status_res.total_pending == status_res.pending_send + status_res.pending_receive
        print("✓ check_sync_pending_status executou com sucesso no banco SQLite!")

if __name__ == "__main__":
    asyncio.run(test_status())
