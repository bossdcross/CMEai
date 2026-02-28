from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File, Depends, Query
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import base64
import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.units import inch
import openpyxl
from openpyxl.styles import Font, Alignment, Border, Side
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ MODELS ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    profession: Optional[str] = None  # physician, np_pa, nurse
    npi_number: Optional[str] = None  # National Provider Identifier
    npi_verified: bool = False  # Whether NPI has been validated
    npi_data: Optional[Dict[str, Any]] = None  # Data from NPPES registry
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    session_id: str
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Certificate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    certificate_id: str = Field(default_factory=lambda: f"cert_{uuid.uuid4().hex[:12]}")
    user_id: str
    title: str
    provider: str
    credits: float
    credit_types: List[str] = []  # Multiple credit types e.g., ["ama_cat1", "moc"]
    credit_type: Optional[str] = None  # Legacy field for backwards compatibility
    subject: Optional[str] = None
    completion_date: str
    expiration_date: Optional[str] = None
    certificate_number: Optional[str] = None
    image_url: Optional[str] = None
    ocr_status: str = "none"  # none, processing, completed, failed
    ocr_data: Optional[Dict[str, Any]] = None
    eeds_imported: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CertificateCreate(BaseModel):
    title: str
    provider: str
    credits: float
    credit_types: List[str] = []  # Multiple credit types
    credit_type: Optional[str] = None  # Legacy support
    subject: Optional[str] = None
    completion_date: str
    expiration_date: Optional[str] = None
    certificate_number: Optional[str] = None

class Requirement(BaseModel):
    model_config = ConfigDict(extra="ignore")
    requirement_id: str = Field(default_factory=lambda: f"req_{uuid.uuid4().hex[:12]}")
    user_id: str
    name: str
    requirement_type: str  # license_renewal, board_recert, hospital, personal
    credit_types: List[str] = []  # Multiple credit types that can satisfy this requirement
    credit_type: Optional[str] = None  # Legacy field
    credits_required: float
    credits_earned: float = 0
    start_year: Optional[int] = None  # Year range start
    end_year: Optional[int] = None  # Year range end
    due_date: str
    notes: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RequirementCreate(BaseModel):
    name: str
    requirement_type: str
    credit_types: List[str] = []
    credit_type: Optional[str] = None
    credits_required: float
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    due_date: str
    notes: Optional[str] = None

class RequirementUpdate(BaseModel):
    name: Optional[str] = None
    credit_types: Optional[List[str]] = None
    credits_required: Optional[float] = None
    start_year: Optional[int] = None
    end_year: Optional[int] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class CustomCreditType(BaseModel):
    model_config = ConfigDict(extra="ignore")
    credit_type_id: str = Field(default_factory=lambda: f"custom_{uuid.uuid4().hex[:8]}")
    user_id: str
    name: str
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# CME Types by Profession
CME_TYPES = {
    "physician": [
        {"id": "ama_cat1", "name": "AMA PRA Category 1", "description": "Gold standard for physician CME"},
        {"id": "ama_cat2", "name": "AMA PRA Category 2", "description": "Self-reported educational activities"},
        {"id": "aoa_1a", "name": "AOA Category 1-A", "description": "Osteopathic medical teaching"},
        {"id": "aoa_1b", "name": "AOA Category 1-B", "description": "Board certification activities"},
        {"id": "moc", "name": "MOC/MOL", "description": "Maintenance of Certification/Licensure"},
        {"id": "self_assessment", "name": "Self-Assessment", "description": "Knowledge self-assessment"},
        {"id": "ethics", "name": "Medical Ethics", "description": "Ethics credits"},
        {"id": "pain_mgmt", "name": "Pain Management", "description": "Pain management/opioid prescribing"},
    ],
    "np_pa": [
        {"id": "aanp_contact", "name": "AANP Contact Hours", "description": "NP contact hours"},
        {"id": "aapa_cat1", "name": "AAPA Category 1", "description": "PA Category 1 credits"},
        {"id": "ama_cat1", "name": "AMA PRA Category 1", "description": "Accepted for NP/PA"},
        {"id": "pharmacology", "name": "Pharmacology CE", "description": "Pharmacology continuing education"},
        {"id": "ancc_contact", "name": "ANCC Contact Hours", "description": "Nursing contact hours"},
        {"id": "self_assessment", "name": "Self-Assessment", "description": "Knowledge self-assessment"},
    ],
    "nurse": [
        {"id": "ancc_contact", "name": "ANCC Contact Hours", "description": "Primary nursing CE"},
        {"id": "cne", "name": "CNE Credits", "description": "Continuing nursing education"},
        {"id": "pharmacology", "name": "Pharmacology CE", "description": "Required for NPs/CNSs"},
        {"id": "specialty", "name": "Specialty CE", "description": "Specialty-specific education"},
        {"id": "ethics", "name": "Nursing Ethics", "description": "Ethics credits"},
        {"id": "cultural", "name": "Cultural Competency", "description": "Cultural competency training"},
    ]
}

# ============ AUTH HELPERS ============

async def get_current_user(request: Request) -> User:
    """Get current user from session token"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user)

# ============ AUTH ROUTES ============

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange session_id for session_token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as client:
        auth_response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    
    if auth_response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    
    auth_data = auth_response.json()
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    session_token = auth_data.get("session_token", f"st_{uuid.uuid4().hex}")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user data
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": auth_data["name"],
                "picture": auth_data.get("picture"),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    else:
        # Create new user
        new_user = {
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data["name"],
            "picture": auth_data.get("picture"),
            "profession": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
    
    # Create session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    session_doc = {
        "session_id": str(uuid.uuid4()),
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Remove old sessions for this user
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user"""
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
    return {"message": "Logged out successfully"}

# ============ USER ROUTES ============

@api_router.put("/users/profession")
async def update_profession(request: Request, user: User = Depends(get_current_user)):
    """Update user profession"""
    body = await request.json()
    profession = body.get("profession")
    
    if profession not in ["physician", "np_pa", "nurse"]:
        raise HTTPException(status_code=400, detail="Invalid profession")
    
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"profession": profession, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    updated_user = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return updated_user

@api_router.get("/users/profile")
async def get_profile(user: User = Depends(get_current_user)):
    """Get user profile with stats"""
    # Get certificate stats
    total_certs = await db.certificates.count_documents({"user_id": user.user_id})
    
    # Get total credits
    pipeline = [
        {"$match": {"user_id": user.user_id}},
        {"$group": {"_id": None, "total_credits": {"$sum": "$credits"}}}
    ]
    result = await db.certificates.aggregate(pipeline).to_list(1)
    total_credits = result[0]["total_credits"] if result else 0
    
    # Get active requirements
    active_reqs = await db.requirements.count_documents({"user_id": user.user_id, "is_active": True})
    
    return {
        **user.model_dump(),
        "stats": {
            "total_certificates": total_certs,
            "total_credits": total_credits,
            "active_requirements": active_reqs
        }
    }

# ============ NPI VALIDATION ============

def validate_npi_checksum(npi: str) -> bool:
    """Validate NPI using Luhn algorithm (ISO/IEC 7812)"""
    if not npi or len(npi) != 10 or not npi.isdigit():
        return False
    
    # Prefix with 80840 for healthcare NPI
    prefixed = "80840" + npi
    
    # Luhn algorithm
    total = 0
    for i, digit in enumerate(reversed(prefixed)):
        d = int(digit)
        if i % 2 == 1:  # Double every second digit from right
            d *= 2
            if d > 9:
                d -= 9
        total += d
    
    return total % 10 == 0

async def lookup_npi_registry(npi: str) -> Optional[Dict[str, Any]]:
    """Look up NPI in NPPES registry"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://npiregistry.cms.hhs.gov/api/?number={npi}&version=2.1",
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("result_count", 0) > 0:
                    result = data["results"][0]
                    basic = result.get("basic", {})
                    
                    # Extract relevant info
                    return {
                        "npi": result.get("number"),
                        "entity_type": result.get("enumeration_type"),
                        "first_name": basic.get("first_name"),
                        "last_name": basic.get("last_name"),
                        "organization_name": basic.get("organization_name"),
                        "credential": basic.get("credential"),
                        "status": basic.get("status"),
                        "enumeration_date": basic.get("enumeration_date"),
                        "last_updated": basic.get("last_updated"),
                        "taxonomies": [
                            {
                                "code": t.get("code"),
                                "desc": t.get("desc"),
                                "primary": t.get("primary")
                            }
                            for t in result.get("taxonomies", [])
                        ]
                    }
        return None
    except Exception as e:
        logger.error(f"NPI lookup error: {e}")
        return None

@api_router.post("/users/npi/validate")
async def validate_npi(request: Request, user: User = Depends(get_current_user)):
    """Validate and link NPI number to profile"""
    body = await request.json()
    npi = body.get("npi", "").strip()
    
    if not npi:
        raise HTTPException(status_code=400, detail="NPI number is required")
    
    # Format validation
    if not validate_npi_checksum(npi):
        raise HTTPException(status_code=400, detail="Invalid NPI format. Must be a valid 10-digit NPI number.")
    
    # Lookup in NPPES registry
    npi_data = await lookup_npi_registry(npi)
    
    if not npi_data:
        raise HTTPException(status_code=404, detail="NPI not found in NPPES registry. Please verify the number.")
    
    # Update user with NPI data
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "npi_number": npi,
            "npi_verified": True,
            "npi_data": npi_data,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    updated_user = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return {
        "message": "NPI verified successfully",
        "user": updated_user,
        "npi_data": npi_data
    }

@api_router.delete("/users/npi")
async def remove_npi(user: User = Depends(get_current_user)):
    """Remove NPI number from profile"""
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "npi_number": None,
            "npi_verified": False,
            "npi_data": None,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    updated_user = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return {"message": "NPI removed", "user": updated_user}

# ============ CME TYPES ROUTES ============

@api_router.get("/cme-types")
async def get_cme_types(user: User = Depends(get_current_user)):
    """Get CME types for user's profession"""
    profession = user.profession or "physician"
    return CME_TYPES.get(profession, CME_TYPES["physician"])

@api_router.get("/cme-types/all")
async def get_all_cme_types():
    """Get all CME types"""
    return CME_TYPES

# ============ CERTIFICATE ROUTES ============

@api_router.get("/certificates")
async def get_certificates(
    user: User = Depends(get_current_user),
    credit_type: Optional[str] = None,
    year: Optional[int] = None
):
    """Get user's certificates"""
    query = {"user_id": user.user_id}
    
    if credit_type:
        query["credit_type"] = credit_type
    
    if year:
        query["completion_date"] = {"$regex": f"^{year}"}
    
    certificates = await db.certificates.find(query, {"_id": 0}).sort("completion_date", -1).to_list(1000)
    return certificates

@api_router.post("/certificates")
async def create_certificate(cert_data: CertificateCreate, user: User = Depends(get_current_user)):
    """Create a new certificate"""
    cert = Certificate(
        user_id=user.user_id,
        **cert_data.model_dump()
    )
    
    cert_dict = cert.model_dump()
    cert_dict["created_at"] = cert_dict["created_at"].isoformat()
    cert_dict["updated_at"] = cert_dict["updated_at"].isoformat()
    
    await db.certificates.insert_one(cert_dict)
    cert_dict.pop("_id", None)  # Remove MongoDB's _id to avoid serialization error
    
    # Update requirement progress
    await update_requirement_progress(user.user_id)
    
    return cert_dict

@api_router.get("/certificates/{certificate_id}")
async def get_certificate(certificate_id: str, user: User = Depends(get_current_user)):
    """Get a specific certificate"""
    cert = await db.certificates.find_one(
        {"certificate_id": certificate_id, "user_id": user.user_id},
        {"_id": 0}
    )
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return cert

@api_router.put("/certificates/{certificate_id}")
async def update_certificate(certificate_id: str, request: Request, user: User = Depends(get_current_user)):
    """Update a certificate"""
    body = await request.json()
    
    result = await db.certificates.update_one(
        {"certificate_id": certificate_id, "user_id": user.user_id},
        {"$set": {**body, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    # Update requirement progress
    await update_requirement_progress(user.user_id)
    
    cert = await db.certificates.find_one({"certificate_id": certificate_id}, {"_id": 0})
    return cert

@api_router.delete("/certificates/{certificate_id}")
async def delete_certificate(certificate_id: str, user: User = Depends(get_current_user)):
    """Delete a certificate"""
    result = await db.certificates.delete_one(
        {"certificate_id": certificate_id, "user_id": user.user_id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    # Update requirement progress
    await update_requirement_progress(user.user_id)
    
    return {"message": "Certificate deleted"}

@api_router.post("/certificates/upload")
async def upload_certificate(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user)
):
    """Upload certificate image/PDF for OCR processing"""
    # Read file content
    content = await file.read()
    base64_content = base64.b64encode(content).decode('utf-8')
    
    # Create certificate with pending OCR
    cert = Certificate(
        user_id=user.user_id,
        title="Processing...",
        provider="Processing...",
        credits=0,
        credit_type="unknown",
        completion_date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        ocr_status="processing",
        image_url=f"data:{file.content_type};base64,{base64_content}"
    )
    
    cert_dict = cert.model_dump()
    cert_dict["created_at"] = cert_dict["created_at"].isoformat()
    cert_dict["updated_at"] = cert_dict["updated_at"].isoformat()
    
    await db.certificates.insert_one(cert_dict)
    cert_dict.pop("_id", None)  # Remove MongoDB's _id to avoid serialization error
    
    # Process OCR in background (we'll return immediately and process async)
    # For now, we'll do it synchronously for simplicity
    try:
        ocr_result = await process_certificate_ocr(cert.certificate_id, base64_content, file.content_type)
        return ocr_result
    except Exception as e:
        logger.error(f"OCR processing failed: {e}")
        await db.certificates.update_one(
            {"certificate_id": cert.certificate_id},
            {"$set": {"ocr_status": "failed"}}
        )
        return cert_dict

async def process_certificate_ocr(certificate_id: str, base64_content: str, mime_type: str):
    """Process certificate with GPT-4o vision"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        
        api_key = os.environ.get("EMERGENT_LLM_KEY")
        if not api_key:
            raise Exception("EMERGENT_LLM_KEY not configured")
        
        chat = LlmChat(
            api_key=api_key,
            session_id=f"ocr_{certificate_id}",
            system_message="""You are a CME certificate data extractor. Extract the following information from the certificate image:
- title: The name/title of the CME activity
- provider: The organization that provided the CME
- credits: The number of CME credits (numeric value)
- credit_type: The type of credit (e.g., "AMA PRA Category 1", "AANP Contact Hours", etc.)
- completion_date: The date of completion (YYYY-MM-DD format)
- certificate_number: Any certificate or reference number
- subject: The medical subject/topic

Return ONLY a valid JSON object with these fields. If a field cannot be determined, use null."""
        ).with_model("openai", "gpt-4o")
        
        image_content = ImageContent(image_base64=base64_content)
        
        response = await chat.send_message(UserMessage(
            text="Extract the CME certificate information from this image.",
            file_contents=[image_content]
        ))
        
        # Parse response
        try:
            # Clean up response if needed
            response_text = response.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            
            ocr_data = json.loads(response_text)
        except json.JSONDecodeError:
            ocr_data = {"raw_text": response}
        
        # Map credit type to our internal types
        credit_type_map = {
            "ama pra category 1": "ama_cat1",
            "ama category 1": "ama_cat1",
            "category 1": "ama_cat1",
            "ama pra category 2": "ama_cat2",
            "category 2": "ama_cat2",
            "aanp": "aanp_contact",
            "aanp contact": "aanp_contact",
            "ancc": "ancc_contact",
            "ancc contact": "ancc_contact",
            "aapa": "aapa_cat1",
            "pharmacology": "pharmacology",
        }
        
        extracted_credit_type = ocr_data.get("credit_type", "")
        if extracted_credit_type:
            normalized_type = extracted_credit_type.lower().strip()
            for key, value in credit_type_map.items():
                if key in normalized_type:
                    ocr_data["credit_type_id"] = value
                    break
            else:
                ocr_data["credit_type_id"] = "ama_cat1"  # Default
        
        # Update certificate with OCR data
        update_data = {
            "ocr_status": "completed",
            "ocr_data": ocr_data,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        if ocr_data.get("title"):
            update_data["title"] = ocr_data["title"]
        if ocr_data.get("provider"):
            update_data["provider"] = ocr_data["provider"]
        if ocr_data.get("credits"):
            try:
                update_data["credits"] = float(ocr_data["credits"])
            except (ValueError, TypeError):
                pass
        if ocr_data.get("credit_type_id"):
            update_data["credit_type"] = ocr_data["credit_type_id"]
        if ocr_data.get("completion_date"):
            update_data["completion_date"] = ocr_data["completion_date"]
        if ocr_data.get("certificate_number"):
            update_data["certificate_number"] = ocr_data["certificate_number"]
        if ocr_data.get("subject"):
            update_data["subject"] = ocr_data["subject"]
        
        await db.certificates.update_one(
            {"certificate_id": certificate_id},
            {"$set": update_data}
        )
        
        cert = await db.certificates.find_one({"certificate_id": certificate_id}, {"_id": 0})
        return cert
        
    except Exception as e:
        logger.error(f"OCR Error: {e}")
        await db.certificates.update_one(
            {"certificate_id": certificate_id},
            {"$set": {"ocr_status": "failed", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        cert = await db.certificates.find_one({"certificate_id": certificate_id}, {"_id": 0})
        return cert

@api_router.post("/certificates/eeds-import")
async def import_eeds_certificate(request: Request, user: User = Depends(get_current_user)):
    """Import certificate from EEDS QR code data"""
    body = await request.json()
    qr_data = body.get("qr_data", "")
    
    # Parse EEDS QR code data (format varies, this is a basic implementation)
    # EEDS typically encodes certificate info in the QR code
    cert_data = {
        "title": body.get("title", "EEDS Certificate"),
        "provider": body.get("provider", "EEDS"),
        "credits": float(body.get("credits", 1)),
        "credit_type": body.get("credit_type", "ama_cat1"),
        "completion_date": body.get("completion_date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        "certificate_number": body.get("certificate_number"),
        "subject": body.get("subject"),
        "eeds_imported": True
    }
    
    cert = Certificate(user_id=user.user_id, **cert_data)
    cert_dict = cert.model_dump()
    cert_dict["created_at"] = cert_dict["created_at"].isoformat()
    cert_dict["updated_at"] = cert_dict["updated_at"].isoformat()
    
    await db.certificates.insert_one(cert_dict)
    cert_dict.pop("_id", None)  # Remove MongoDB's _id to avoid serialization error
    
    # Update requirement progress
    await update_requirement_progress(user.user_id)
    
    return cert_dict

# ============ REQUIREMENTS ROUTES ============

@api_router.get("/requirements")
async def get_requirements(
    user: User = Depends(get_current_user),
    active_only: bool = True
):
    """Get user's requirements"""
    query = {"user_id": user.user_id}
    if active_only:
        query["is_active"] = True
    
    requirements = await db.requirements.find(query, {"_id": 0}).sort("due_date", 1).to_list(100)
    return requirements

@api_router.post("/requirements")
async def create_requirement(req_data: RequirementCreate, user: User = Depends(get_current_user)):
    """Create a new requirement"""
    req = Requirement(user_id=user.user_id, **req_data.model_dump())
    
    req_dict = req.model_dump()
    req_dict["created_at"] = req_dict["created_at"].isoformat()
    req_dict["updated_at"] = req_dict["updated_at"].isoformat()
    
    await db.requirements.insert_one(req_dict)
    
    # Calculate initial progress
    await update_single_requirement_progress(user.user_id, req.requirement_id)
    
    req = await db.requirements.find_one({"requirement_id": req.requirement_id}, {"_id": 0})
    return req

@api_router.get("/requirements/{requirement_id}")
async def get_requirement(requirement_id: str, user: User = Depends(get_current_user)):
    """Get a specific requirement"""
    req = await db.requirements.find_one(
        {"requirement_id": requirement_id, "user_id": user.user_id},
        {"_id": 0}
    )
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")
    return req

@api_router.put("/requirements/{requirement_id}")
async def update_requirement(
    requirement_id: str,
    req_data: RequirementUpdate,
    user: User = Depends(get_current_user)
):
    """Update a requirement"""
    update_dict = {k: v for k, v in req_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.requirements.update_one(
        {"requirement_id": requirement_id, "user_id": user.user_id},
        {"$set": update_dict}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    req = await db.requirements.find_one({"requirement_id": requirement_id}, {"_id": 0})
    return req

@api_router.delete("/requirements/{requirement_id}")
async def delete_requirement(requirement_id: str, user: User = Depends(get_current_user)):
    """Delete a requirement"""
    result = await db.requirements.delete_one(
        {"requirement_id": requirement_id, "user_id": user.user_id}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Requirement not found")
    
    return {"message": "Requirement deleted"}

async def update_requirement_progress(user_id: str):
    """Update progress for all user requirements"""
    requirements = await db.requirements.find(
        {"user_id": user_id, "is_active": True},
        {"_id": 0}
    ).to_list(100)
    
    for req in requirements:
        await update_single_requirement_progress(user_id, req["requirement_id"])

async def update_single_requirement_progress(user_id: str, requirement_id: str):
    """Update progress for a single requirement"""
    req = await db.requirements.find_one({"requirement_id": requirement_id}, {"_id": 0})
    if not req:
        return
    
    # Build query for matching certificates
    query = {"user_id": user_id}
    
    # If specific credit type required
    if req.get("credit_type"):
        query["credit_type"] = req["credit_type"]
    
    # Get certificates completed before due date
    due_date = req["due_date"]
    
    pipeline = [
        {"$match": query},
        {"$group": {"_id": None, "total_credits": {"$sum": "$credits"}}}
    ]
    
    result = await db.certificates.aggregate(pipeline).to_list(1)
    credits_earned = result[0]["total_credits"] if result else 0
    
    await db.requirements.update_one(
        {"requirement_id": requirement_id},
        {"$set": {"credits_earned": credits_earned, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

# ============ REPORTS ROUTES ============

@api_router.get("/reports/summary")
async def get_report_summary(
    user: User = Depends(get_current_user),
    year: Optional[int] = None
):
    """Get summary report data"""
    current_year = year or datetime.now().year
    
    # Get certificates for the year
    certs = await db.certificates.find(
        {"user_id": user.user_id, "completion_date": {"$regex": f"^{current_year}"}},
        {"_id": 0}
    ).to_list(1000)
    
    # Group by credit type
    by_type = {}
    total_credits = 0
    
    for cert in certs:
        credit_type = cert.get("credit_type", "unknown")
        credits = cert.get("credits", 0)
        
        if credit_type not in by_type:
            by_type[credit_type] = {"credits": 0, "count": 0}
        
        by_type[credit_type]["credits"] += credits
        by_type[credit_type]["count"] += 1
        total_credits += credits
    
    # Get requirements progress
    requirements = await db.requirements.find(
        {"user_id": user.user_id, "is_active": True},
        {"_id": 0}
    ).to_list(100)
    
    return {
        "year": current_year,
        "total_certificates": len(certs),
        "total_credits": total_credits,
        "by_credit_type": by_type,
        "requirements": requirements,
        "certificates": certs
    }

@api_router.get("/reports/export/pdf")
async def export_pdf(
    user: User = Depends(get_current_user),
    year: Optional[int] = None
):
    """Export transcript as PDF"""
    summary = await get_report_summary(user, year)
    
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # Header
    c.setFont("Helvetica-Bold", 18)
    c.drawString(1*inch, height - 1*inch, "CME Transcript")
    
    c.setFont("Helvetica", 12)
    c.drawString(1*inch, height - 1.3*inch, f"Name: {user.name}")
    c.drawString(1*inch, height - 1.5*inch, f"Year: {summary['year']}")
    c.drawString(1*inch, height - 1.7*inch, f"Total Credits: {summary['total_credits']}")
    
    # Credits by type
    y = height - 2.2*inch
    c.setFont("Helvetica-Bold", 14)
    c.drawString(1*inch, y, "Credits by Type")
    y -= 0.3*inch
    
    c.setFont("Helvetica", 10)
    for credit_type, data in summary['by_credit_type'].items():
        c.drawString(1.2*inch, y, f"• {credit_type}: {data['credits']} credits ({data['count']} certificates)")
        y -= 0.25*inch
    
    # Certificates list
    y -= 0.3*inch
    c.setFont("Helvetica-Bold", 14)
    c.drawString(1*inch, y, "Certificates")
    y -= 0.3*inch
    
    c.setFont("Helvetica", 9)
    for cert in summary['certificates'][:30]:  # Limit to prevent overflow
        if y < 1*inch:
            c.showPage()
            y = height - 1*inch
            c.setFont("Helvetica", 9)
        
        c.drawString(1.2*inch, y, f"• {cert['title'][:50]} - {cert['credits']} credits ({cert['completion_date']})")
        y -= 0.2*inch
    
    c.save()
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=cme_transcript_{summary['year']}.pdf"}
    )

@api_router.get("/reports/export/excel")
async def export_excel(
    user: User = Depends(get_current_user),
    year: Optional[int] = None
):
    """Export transcript as Excel"""
    summary = await get_report_summary(user, year)
    
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "CME Transcript"
    
    # Header
    ws['A1'] = "CME Transcript"
    ws['A1'].font = Font(bold=True, size=16)
    ws['A2'] = f"Name: {user.name}"
    ws['A3'] = f"Year: {summary['year']}"
    ws['A4'] = f"Total Credits: {summary['total_credits']}"
    
    # Headers for certificate table
    headers = ["Title", "Provider", "Credits", "Credit Type", "Completion Date", "Certificate #"]
    for col, header in enumerate(headers, 1):
        cell = ws.cell(row=6, column=col, value=header)
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal='center')
    
    # Certificate data
    for row, cert in enumerate(summary['certificates'], 7):
        ws.cell(row=row, column=1, value=cert.get('title', ''))
        ws.cell(row=row, column=2, value=cert.get('provider', ''))
        ws.cell(row=row, column=3, value=cert.get('credits', 0))
        ws.cell(row=row, column=4, value=cert.get('credit_type', ''))
        ws.cell(row=row, column=5, value=cert.get('completion_date', ''))
        ws.cell(row=row, column=6, value=cert.get('certificate_number', ''))
    
    # Adjust column widths
    ws.column_dimensions['A'].width = 40
    ws.column_dimensions['B'].width = 30
    ws.column_dimensions['C'].width = 10
    ws.column_dimensions['D'].width = 20
    ws.column_dimensions['E'].width = 15
    ws.column_dimensions['F'].width = 15
    
    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=cme_transcript_{summary['year']}.xlsx"}
    )

@api_router.get("/reports/export/html")
async def export_html(
    user: User = Depends(get_current_user),
    year: Optional[int] = None
):
    """Export transcript as printable HTML"""
    summary = await get_report_summary(user, year)
    
    html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>CME Transcript - {user.name}</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }}
        h1 {{ color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; }}
        .header {{ margin-bottom: 30px; }}
        .header p {{ margin: 5px 0; color: #64748b; }}
        .summary {{ background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; }}
        .summary h3 {{ margin-top: 0; color: #334155; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 20px; }}
        th {{ background: #4F46E5; color: white; padding: 12px; text-align: left; }}
        td {{ padding: 10px; border-bottom: 1px solid #e2e8f0; }}
        tr:hover {{ background: #f8fafc; }}
        .credit-type {{ display: inline-block; background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-size: 12px; }}
        @media print {{
            body {{ print-color-adjust: exact; -webkit-print-color-adjust: exact; }}
            .no-print {{ display: none; }}
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>CME Transcript</h1>
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Year:</strong> {summary['year']}</p>
        <p><strong>Generated:</strong> {datetime.now().strftime('%B %d, %Y')}</p>
    </div>
    
    <div class="summary">
        <h3>Summary</h3>
        <p><strong>Total Certificates:</strong> {summary['total_certificates']}</p>
        <p><strong>Total Credits:</strong> {summary['total_credits']}</p>
    </div>
    
    <h2>Certificates</h2>
    <table>
        <thead>
            <tr>
                <th>Title</th>
                <th>Provider</th>
                <th>Credits</th>
                <th>Type</th>
                <th>Date</th>
            </tr>
        </thead>
        <tbody>
"""
    
    for cert in summary['certificates']:
        html += f"""
            <tr>
                <td>{cert.get('title', '')}</td>
                <td>{cert.get('provider', '')}</td>
                <td>{cert.get('credits', 0)}</td>
                <td><span class="credit-type">{cert.get('credit_type', '')}</span></td>
                <td>{cert.get('completion_date', '')}</td>
            </tr>
"""
    
    html += """
        </tbody>
    </table>
    
    <p class="no-print" style="margin-top: 30px; text-align: center;">
        <button onclick="window.print()" style="background: #4F46E5; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
            Print Transcript
        </button>
    </p>
</body>
</html>
"""
    
    return Response(content=html, media_type="text/html")

# ============ DASHBOARD ROUTES ============

@api_router.get("/dashboard")
async def get_dashboard(user: User = Depends(get_current_user)):
    """Get dashboard data"""
    current_year = datetime.now().year
    
    # Get recent certificates
    recent_certs = await db.certificates.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    # Get active requirements with progress
    requirements = await db.requirements.find(
        {"user_id": user.user_id, "is_active": True},
        {"_id": 0}
    ).sort("due_date", 1).to_list(10)
    
    # Get credits by type for current year
    pipeline = [
        {"$match": {"user_id": user.user_id, "completion_date": {"$regex": f"^{current_year}"}}},
        {"$group": {"_id": "$credit_type", "total": {"$sum": "$credits"}, "count": {"$sum": 1}}}
    ]
    credits_by_type = await db.certificates.aggregate(pipeline).to_list(20)
    
    # Get total credits this year
    total_pipeline = [
        {"$match": {"user_id": user.user_id, "completion_date": {"$regex": f"^{current_year}"}}},
        {"$group": {"_id": None, "total": {"$sum": "$credits"}}}
    ]
    total_result = await db.certificates.aggregate(total_pipeline).to_list(1)
    total_credits = total_result[0]["total"] if total_result else 0
    
    # Get upcoming deadlines
    upcoming = [r for r in requirements if r.get("due_date", "") >= datetime.now().strftime("%Y-%m-%d")][:5]
    
    return {
        "user": user.model_dump(),
        "recent_certificates": recent_certs,
        "requirements": requirements,
        "upcoming_deadlines": upcoming,
        "credits_by_type": credits_by_type,
        "total_credits_this_year": total_credits,
        "year": current_year
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
