from flask import Blueprint, request, jsonify
from backend.database import get_db
from backend.models import MCPServer, MCPServerType

mcp_bp = Blueprint('mcp', __name__)

@mcp_bp.route('/mcp-servers', methods=['GET'])
def list_servers():
    db = next(get_db())
    servers = db.query(MCPServer).all()
    return jsonify([{
        "id": s.id,
        "name": s.name,
        "type": s.type.value,
        "enabled": s.enabled,
        "command": s.command,
        "args": s.args,
        "env": s.env,
        "url": s.url,
        "headers": s.headers,
        "createdAt": s.createdAt.isoformat(),
        "updatedAt": s.updatedAt.isoformat()
    } for s in servers])

@mcp_bp.route('/mcp-servers', methods=['POST'])
def create_server():
    db = next(get_db())
    data = request.json
    
    new_server = MCPServer(
        name=data['name'],
        type=MCPServerType(data['type']),
        enabled=data.get('enabled', True),
        command=data.get('command'),
        args=data.get('args'),
        env=data.get('env'),
        url=data.get('url'),
        headers=data.get('headers')
    )
    
    db.add(new_server)
    db.commit()
    
    return jsonify({"id": new_server.id}), 201

@mcp_bp.route('/mcp-servers', methods=['PATCH'])
def update_server():
    db = next(get_db())
    data = request.json
    server_id = data.get('id')
    
    server = db.query(MCPServer).filter(MCPServer.id == server_id).first()
    if not server:
        return jsonify({"error": "Server not found"}), 404
        
    if 'enabled' in data:
        server.enabled = data['enabled']
        
    # Add other fields update logic as needed
    
    db.commit()
    return jsonify({"success": True})

@mcp_bp.route('/mcp-servers', methods=['DELETE'])
def delete_server():
    server_id = request.args.get('id')
    db = next(get_db())
    
    server = db.query(MCPServer).filter(MCPServer.id == server_id).first()
    if not server:
        return jsonify({"error": "Server not found"}), 404
        
    db.delete(server)
    db.commit()
    return jsonify({"success": True})

@mcp_bp.route('/mcp-tools', methods=['GET'])
def list_tools():
    # Placeholder for actual tool listing
    # In a real implementation, this would connect to servers and fetch tools
    return jsonify({
        "serverGroups": {},
        "totalCount": 0
    })
