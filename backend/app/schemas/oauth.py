from pydantic import BaseModel

class OAuthSettingsCreate(BaseModel):
    provider: str
    client_id: str
    client_secret: str

class OAuthSettings(OAuthSettingsCreate):
    id: int
    is_active: bool

    class Config:
        from_attributes = True