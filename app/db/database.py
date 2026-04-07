# app/db/database.py
import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
<<<<<<< HEAD
from sqlalchemy.pool import NullPool
=======
>>>>>>> 4d5f14d533612f7d8fd7782bc57596cd95018ffe
from dotenv import load_dotenv

load_dotenv()

<<<<<<< HEAD
_raw_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./vit.db")
=======
_raw_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@localhost:5432/vit_db")
>>>>>>> 4d5f14d533612f7d8fd7782bc57596cd95018ffe

from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

# Guarantee asyncpg driver — replace any sync postgres scheme and remove unsupported sslmode params
def _make_async_url(url: str) -> str:
    # If already has async driver, return as-is
    if "aiosqlite" in url or "asyncpg" in url:
        return url

    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))

    # asyncpg does not accept sslmode as a direct connect keyword argument
    query.pop("sslmode", None)

    scheme = parsed.scheme
    if scheme in ("postgresql", "postgres") or scheme == "postgresql+psycopg2":
        scheme = "postgresql+asyncpg"
    elif scheme == "sqlite":
        scheme = "sqlite+aiosqlite"

    safe_query = urlencode(query)
    return urlunparse(parsed._replace(scheme=scheme, query=safe_query))

DATABASE_URL = _make_async_url(_raw_url)

<<<<<<< HEAD
_is_sqlite = "aiosqlite" in DATABASE_URL

# SQLite needs NullPool (no connection pool); PostgreSQL uses queue pool
if _is_sqlite:
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        future=True,
        poolclass=NullPool,
    )
else:
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        future=True,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
    )
=======
# Async Engine with connection pooling
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)
>>>>>>> 4d5f14d533612f7d8fd7782bc57596cd95018ffe

# Session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


# Dependency for FastAPI
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
