from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from database import Base

class Permission(Base):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255))
    roles = relationship("RolePermission", back_populates="permission")

class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))
    parent_role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    
    parent_role = relationship("Role", remote_side=[id], backref="child_roles")
    permissions = relationship("RolePermission", back_populates="role")
    users = relationship("User", back_populates="role")

class RolePermission(Base):
    __tablename__ = "role_permissions"
    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id"))
    permission_id = Column(Integer, ForeignKey("permissions.id"))
    
    role = relationship("Role", back_populates="permissions")
    permission = relationship("Permission", back_populates="roles")
