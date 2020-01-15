"""empty message

Revision ID: 1926bac23266
Revises: f07c47dc7812
Create Date: 2020-01-15 16:40:57.925308

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1926bac23266'
down_revision = 'f07c47dc7812'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('user', sa.Column('organisation', sa.String(length=120), nullable=True))
    op.create_index(op.f('ix_user_organisation'), 'user', ['organisation'], unique=True)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_user_organisation'), table_name='user')
    op.drop_column('user', 'organisation')
    # ### end Alembic commands ###
