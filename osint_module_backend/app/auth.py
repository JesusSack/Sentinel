from firebase_admin import auth
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class User(BaseModel):
    username: str
    role: str = "analyst"

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        # VERIFICAR EL TOKEN CON GOOGLE FIREBASE
        decoded_token = auth.verify_id_token(token)
        
        # Obtenemos el email del usuario
        email = decoded_token.get("email")
        
        # Validamos si verificó el email 
        if not decoded_token.get("email_verified"):
             raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email no verificado",
            )

        return User(username=email, role="analyst")

    except Exception as e:
        print(f"Error Auth: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas o expiradas",
            headers={"WWW-Authenticate": "Bearer"},
        )