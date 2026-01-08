"""Add clerk_id to users table and remove hashed_password

Revision ID: 001_add_clerk_id
Revises:
Create Date: 2025-01-08

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_add_clerk_id'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add clerk_id column
    op.add_column('users', sa.Column('clerk_id', sa.String(), nullable=True))

    # Create index on clerk_id
    op.create_index('ix_users_clerk_id', 'users', ['clerk_id'], unique=True)

    # Drop hashed_password column
    op.drop_column('users', 'hashed_password')


def downgrade() -> None:
    # Add back hashed_password column
    op.add_column('users', sa.Column('hashed_password', sa.String(), nullable=True))

    # Drop clerk_id index and column
    op.drop_index('ix_users_clerk_id', table_name='users')
    op.drop_column('users', 'clerk_id')
