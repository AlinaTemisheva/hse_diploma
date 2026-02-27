"""
File Upload API Tests
Tests for:
- POST /api/upload (image and document uploads)
- GET /api/uploads/{filename} (file serving)
- File size validation (10MB limit)
- File type validation
"""

import pytest
import requests
import os
import io

# Use environment variable for backend URL
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestFileUploadImages:
    """Tests for image upload functionality"""
    
    def test_upload_image_success(self):
        """Test uploading a valid PNG image"""
        # Create a small test PNG (1x1 pixel)
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # 1x1 pixels
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,  # IDAT chunk
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,
            0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,
            0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,  # IEND chunk
            0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        files = {'file': ('test_image.png', io.BytesIO(png_data), 'image/png')}
        response = requests.post(f"{BASE_URL}/api/upload?file_type=image", files=files)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'url' in data, "Response should contain 'url'"
        assert 'filename' in data, "Response should contain 'filename'"
        assert data['url'].startswith('/api/uploads/'), f"URL should start with /api/uploads/, got {data['url']}"
        assert data['url'].endswith('.png'), "URL should end with .png"
        
        # Store for later retrieval test
        self.uploaded_filename = data['filename']
        print(f"Image upload successful: {data['url']}")
    
    def test_upload_image_jpeg(self):
        """Test uploading a JPEG image"""
        # Minimal JPEG data
        jpeg_data = bytes([
            0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46,
            0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
            0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
            0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
            0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C,
            0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
            0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D,
            0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20,
            0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
            0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27,
            0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34,
            0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
            0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4,
            0x00, 0x1F, 0x00, 0x00, 0x01, 0x05, 0x01, 0x01,
            0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
            0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04,
            0x05, 0x06, 0x07, 0x08, 0x09, 0x0A, 0x0B, 0xFF,
            0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
            0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04,
            0x00, 0x00, 0x01, 0x7D, 0x01, 0x02, 0x03, 0x00,
            0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
            0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32,
            0x81, 0x91, 0xA1, 0x08, 0x23, 0x42, 0xB1, 0xC1,
            0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
            0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A,
            0x25, 0x26, 0x27, 0x28, 0x29, 0x2A, 0x34, 0x35,
            0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
            0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55,
            0x56, 0x57, 0x58, 0x59, 0x5A, 0x63, 0x64, 0x65,
            0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
            0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85,
            0x86, 0x87, 0x88, 0x89, 0x8A, 0x92, 0x93, 0x94,
            0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
            0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2,
            0xB3, 0xB4, 0xB5, 0xB6, 0xB7, 0xB8, 0xB9, 0xBA,
            0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
            0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8,
            0xD9, 0xDA, 0xE1, 0xE2, 0xE3, 0xE4, 0xE5, 0xE6,
            0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
            0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA,
            0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
            0xFB, 0xD5, 0xDB, 0x20, 0xA8, 0xF3, 0xFF, 0xD9
        ])
        
        files = {'file': ('test_image.jpg', io.BytesIO(jpeg_data), 'image/jpeg')}
        response = requests.post(f"{BASE_URL}/api/upload?file_type=image", files=files)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['url'].endswith('.jpg'), "URL should end with .jpg"
        print(f"JPEG upload successful: {data['url']}")

    def test_upload_invalid_image_type(self):
        """Test uploading a non-image file as image should fail"""
        # Try to upload a text file as an image
        text_data = b"This is not an image"
        files = {'file': ('test.txt', io.BytesIO(text_data), 'text/plain')}
        response = requests.post(f"{BASE_URL}/api/upload?file_type=image", files=files)
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'detail' in data, "Response should contain error detail"
        print(f"Invalid image type correctly rejected: {data['detail']}")


class TestFileUploadDocuments:
    """Tests for document upload functionality"""
    
    def test_upload_document_pdf(self):
        """Test uploading a PDF document"""
        # Minimal PDF data
        pdf_data = b"%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF"
        
        files = {'file': ('test_doc.pdf', io.BytesIO(pdf_data), 'application/pdf')}
        response = requests.post(f"{BASE_URL}/api/upload?file_type=document", files=files)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'url' in data, "Response should contain 'url'"
        assert data['url'].endswith('.pdf'), "URL should end with .pdf"
        
        # Store for retrieval test
        self.uploaded_pdf_filename = data['filename']
        print(f"PDF upload successful: {data['url']}")
    
    def test_upload_document_docx(self):
        """Test uploading a DOCX document"""
        # Minimal DOCX (ZIP) signature
        docx_data = bytes([
            0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00,
            0x08, 0x00, 0x00, 0x00, 0x21, 0x00
        ]) + b'\x00' * 100  # Padding to make it look like a zip
        
        files = {'file': ('test_doc.docx', io.BytesIO(docx_data), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')}
        response = requests.post(f"{BASE_URL}/api/upload?file_type=document", files=files)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['url'].endswith('.docx'), "URL should end with .docx"
        print(f"DOCX upload successful: {data['url']}")
    
    def test_upload_document_xlsx(self):
        """Test uploading an XLSX spreadsheet"""
        # Minimal XLSX (ZIP) signature
        xlsx_data = bytes([
            0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00
        ]) + b'\x00' * 100
        
        files = {'file': ('test_spreadsheet.xlsx', io.BytesIO(xlsx_data), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
        response = requests.post(f"{BASE_URL}/api/upload?file_type=document", files=files)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['url'].endswith('.xlsx'), "URL should end with .xlsx"
        print(f"XLSX upload successful: {data['url']}")
    
    def test_upload_document_zip(self):
        """Test uploading a ZIP archive"""
        # Minimal ZIP signature
        zip_data = bytes([
            0x50, 0x4B, 0x03, 0x04, 0x0A, 0x00, 0x00, 0x00,
            0x00, 0x00
        ]) + b'\x00' * 100
        
        files = {'file': ('archive.zip', io.BytesIO(zip_data), 'application/zip')}
        response = requests.post(f"{BASE_URL}/api/upload?file_type=document", files=files)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data['url'].endswith('.zip'), "URL should end with .zip"
        print(f"ZIP upload successful: {data['url']}")
    
    def test_upload_invalid_document_type(self):
        """Test uploading an exe file as document should fail"""
        exe_data = b"MZ\x90\x00" + b'\x00' * 100  # Looks like an EXE
        files = {'file': ('malware.exe', io.BytesIO(exe_data), 'application/octet-stream')}
        response = requests.post(f"{BASE_URL}/api/upload?file_type=document", files=files)
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print(f"Invalid document type correctly rejected")


class TestFileSizeValidation:
    """Tests for file size limit (10MB)"""
    
    def test_file_size_under_limit(self):
        """Test uploading a file under 10MB should succeed"""
        # Create a 1MB file
        one_mb_data = b'\x00' * (1024 * 1024)
        
        # Need valid PNG header
        png_header = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE
        ])
        data = png_header + one_mb_data[:100000]  # ~100KB for speed
        
        files = {'file': ('large.png', io.BytesIO(data), 'image/png')}
        response = requests.post(f"{BASE_URL}/api/upload?file_type=image", files=files)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        print(f"File under limit uploaded successfully")
    
    def test_file_size_over_limit(self):
        """Test uploading a file over 10MB should fail with 413"""
        # Create an 11MB file
        eleven_mb = b'\x00' * (11 * 1024 * 1024)
        
        png_header = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE
        ])
        data = png_header + eleven_mb
        
        files = {'file': ('toolarge.png', io.BytesIO(data), 'image/png')}
        response = requests.post(f"{BASE_URL}/api/upload?file_type=image", files=files)
        
        assert response.status_code == 413, f"Expected 413, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert 'detail' in data, "Response should contain error detail"
        assert '10' in data['detail'] or 'МБ' in data['detail'], "Error should mention 10MB limit"
        print(f"File over limit correctly rejected: {data['detail']}")


class TestFileRetrieval:
    """Tests for retrieving uploaded files"""
    
    def test_retrieve_uploaded_image(self):
        """Test retrieving an uploaded image"""
        # First upload an image
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,
            0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,
            0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
            0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        # Upload
        files = {'file': ('retrieval_test.png', io.BytesIO(png_data), 'image/png')}
        upload_response = requests.post(f"{BASE_URL}/api/upload?file_type=image", files=files)
        
        assert upload_response.status_code == 200
        upload_data = upload_response.json()
        filename = upload_data['filename']
        
        # Now retrieve
        get_response = requests.get(f"{BASE_URL}/api/uploads/{filename}")
        
        assert get_response.status_code == 200, f"Expected 200, got {get_response.status_code}"
        assert len(get_response.content) > 0, "Response content should not be empty"
        print(f"File retrieval successful for {filename}")
    
    def test_retrieve_nonexistent_file(self):
        """Test retrieving a file that doesn't exist should return 404"""
        response = requests.get(f"{BASE_URL}/api/uploads/nonexistent_file_12345.png")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"Nonexistent file correctly returns 404")
    
    def test_directory_traversal_protection(self):
        """Test that directory traversal is prevented"""
        # Try to access a file outside uploads directory
        response = requests.get(f"{BASE_URL}/api/uploads/../server.py")
        
        # Should either return 404 or 403
        assert response.status_code in [403, 404], f"Expected 403 or 404, got {response.status_code}"
        print(f"Directory traversal correctly blocked")


class TestUploadResponseStructure:
    """Tests for upload response data structure"""
    
    def test_upload_response_contains_all_fields(self):
        """Test that upload response contains all expected fields"""
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
            0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0x3F,
            0x00, 0x05, 0xFE, 0x02, 0xFE, 0xDC, 0xCC, 0x59,
            0xE7, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
            0x44, 0xAE, 0x42, 0x60, 0x82
        ])
        
        files = {'file': ('response_test.png', io.BytesIO(png_data), 'image/png')}
        response = requests.post(f"{BASE_URL}/api/upload?file_type=image", files=files)
        
        assert response.status_code == 200
        data = response.json()
        
        # Check all expected fields
        assert 'url' in data, "Response should contain 'url'"
        assert 'filename' in data, "Response should contain 'filename'"
        assert 'original_name' in data, "Response should contain 'original_name'"
        assert 'size' in data, "Response should contain 'size'"
        
        # Validate field values
        assert data['original_name'] == 'response_test.png', f"original_name should be 'response_test.png', got {data['original_name']}"
        assert isinstance(data['size'], int), "size should be an integer"
        assert data['size'] > 0, "size should be greater than 0"
        
        print(f"Response structure verified: url={data['url']}, filename={data['filename']}, original_name={data['original_name']}, size={data['size']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
