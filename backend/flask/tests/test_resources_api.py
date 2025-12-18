
import unittest
import os
import shutil
import tempfile
import json
from unittest.mock import MagicMock, patch
from werkzeug.datastructures import FileStorage
from io import BytesIO
from flask import Flask

# Import the ResourcesModule
# Need to make sure we can import it. The test file is in backend/flask/tests/
# The module is in backend/flask/modules/
# We need to adjust path.
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from modules.resources import ResourcesModule

class TestResourcesModule(unittest.TestCase):

    def setUp(self):
        # Create a temp dir for uploads
        self.test_dir = tempfile.mkdtemp()
        
        # Mock MongoClient to avoid real DB connection and enable mocking
        self.mock_client_patcher = patch('modules.resources.MongoClient')
        self.mock_client_cls = self.mock_client_patcher.start()
        self.mock_db = MagicMock()
        self.mock_collection = MagicMock()
        self.mock_client_cls.return_value = MagicMock()
        self.mock_client_cls.return_value.__getitem__.return_value = self.mock_db
        self.mock_db.__getitem__.return_value = self.mock_collection
        
        # Initialize module
        self.module = ResourcesModule()
        # Override upload folder
        self.module.upload_folder = self.test_dir
        
        # Create Flask app for context
        self.app = Flask(__name__)
        self.module.register_routes(self.app)
        self.client = self.app.test_client()

    def tearDown(self):
        # Remove temp dir
        shutil.rmtree(self.test_dir)
        self.mock_client_patcher.stop()

    def test_upload_success(self):
        # Mock DB insert
        self.module.resources_collection.insert_one.return_value.inserted_id = "507f1f77bcf86cd799439011"
        
        data = {
            'file': (BytesIO(b"dummy pdf content"), 'test.pdf'),
            'userId': 'user123',
            'tags': ['tag1', 'tag2']
        }
        
        response = self.client.post('/f-api/v1/resources/upload', 
                                    data=data, 
                                    content_type='multipart/form-data')
        
        self.assertEqual(response.status_code, 201)
        json_data = response.get_json()
        self.assertEqual(json_data['id'], '507f1f77bcf86cd799439011')
        self.assertEqual(json_data['title'], 'test.pdf')
        
        # Verify file exists on disk
        files = []
        for root, dirs, filenames in os.walk(self.test_dir):
            for f in filenames:
                files.append(f)
        self.assertEqual(len(files), 1)

    def test_upload_invalid_file_type(self):
        data = {
            'file': (BytesIO(b"exe content"), 'malware.exe'),
            'userId': 'user123'
        }
        
        response = self.client.post('/f-api/v1/resources/upload', 
                                    data=data, 
                                    content_type='multipart/form-data')
        
        self.assertEqual(response.status_code, 400)
        self.assertIn('File type not allowed', response.get_json()['error'])

    def test_list_resources(self):
        # Mock DB find
        mock_cursor = [
            {
                "_id": "507f1f77bcf86cd799439011",
                "title": "test.pdf",
                "type": "document",
                "fileSize": 1024,
                "tags": ["tag1"],
                "createdAt": datetime(2024, 1, 1)
            }
        ]
        # Mock find().sort().skip().limit()
        cursor_mock = MagicMock()
        cursor_mock.sort.return_value = cursor_mock
        cursor_mock.skip.return_value = cursor_mock
        cursor_mock.limit.return_value = mock_cursor
        
        self.module.resources_collection.find.return_value = cursor_mock
        self.module.resources_collection.count_documents.return_value = 1
        
        response = self.client.get('/f-api/v1/resources?userId=user123')
        
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(len(data['resources']), 1)
        self.assertEqual(data['resources'][0]['title'], 'test.pdf')

    def test_get_resource(self):
        # Mock find_one
        self.module.resources_collection.find_one.return_value = {
            "_id": "507f1f77bcf86cd799439011",
            "userId": "user123",
            "title": "test.pdf",
            "type": "document",
            "filePath": "2024/01/test.pdf",
            "createdAt": datetime(2024, 1, 1),
            "updatedAt": datetime(2024, 1, 1)
        }
        
        response = self.client.get('/f-api/v1/resources/507f1f77bcf86cd799439011')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()['title'], 'test.pdf')

    def test_delete_resource(self):
        self.module.resources_collection.find_one.return_value = {"_id": "507f1f77bcf86cd799439011"}
        
        response = self.client.delete('/f-api/v1/resources/507f1f77bcf86cd799439011')
        self.assertEqual(response.status_code, 200)
        
        # Verify update_one called
        self.module.resources_collection.update_one.assert_called()

from datetime import datetime

if __name__ == '__main__':
    unittest.main()
