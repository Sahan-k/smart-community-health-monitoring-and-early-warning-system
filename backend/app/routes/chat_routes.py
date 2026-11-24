from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database.connection import get_db
from backend.app.models.db_models import User, ChatHistory
from backend.app.models.schemas import ChatMessageCreate, ChatMessageOut
from backend.app.core.auth import get_current_user

router = APIRouter(prefix="/api/chat", tags=["AI Community Health Assistant"])

DISCLAIMER_FOOTER = (
    "\n\n*Note: I am an automated Community Health Assistant for early warning and awareness. "
    "I do not provide medical diagnoses or replace professional healthcare providers. "
    "If you experience severe symptoms, please consult a medical professional or visit your nearest healthcare center.*"
)

PREVENTIVE_KNOWLEDGE = {
    "fever": "For general fever management: stay well-hydrated with clean water, rest adequately, and monitor your temperature. If fever persists over 3 days or is accompanied by severe rash, neck stiffness, or breathing diffculties, seek medical attention promptly.",
    "dengue": "Dengue awareness: Dengue is transmitted by Aedes mosquitoes breeding in stagnant water. Ensure water storage containers are covered, clear stagnant water around homes, and use mosquito repellents or nets.",
    "malaria": "Malaria awareness: Transmitted by mosquito bites. Use bed nets treated with insecticide, wear long-sleeved clothing during evening hours, and maintain clean drainage in your community.",
    "diarrhea": "Diarrhoeal health advisory: Drink boiled or treated ORS water to prevent dehydration. Wash hands thoroughly with soap before eating and after using the restroom. Seek medical care if blood is present in stool or dehydration occurs.",
    "report": "To submit a health report in this system, click on 'Submit Report' in the navigation bar. You can enter details by typing symptoms or using the voice input feature.",
    "chikungunya": "Chikungunya awareness: Characterized by joint pain and fever. Maintain mosquito control, stay hydrated, and rest."
}


def generate_assistant_response(message: str, lang: str = "en") -> str:
    msg_lower = message.lower()

    if "hello" in msg_lower or "hi" in msg_lower or "namaste" in msg_lower:
        response = (
            "Hello! I am your AI Community Health Assistant. I am here to provide health awareness, "
            "preventive guidance, information on common symptoms, and help you report community health issues."
        )
    elif "report" in msg_lower or "submit" in msg_lower or "how to" in msg_lower:
        response = PREVENTIVE_KNOWLEDGE["report"]
    elif "fever" in msg_lower or "temp" in msg_lower:
        response = PREVENTIVE_KNOWLEDGE["fever"]
    elif "dengue" in msg_lower:
        response = PREVENTIVE_KNOWLEDGE["dengue"]
    elif "malaria" in msg_lower:
        response = PREVENTIVE_KNOWLEDGE["malaria"]
    elif "diarrhea" in msg_lower or "vomit" in msg_lower:
        response = PREVENTIVE_KNOWLEDGE["diarrhea"]
    elif "chikungunya" in msg_lower:
        response = PREVENTIVE_KNOWLEDGE["chikungunya"]
    elif "covid" in msg_lower or "respiratory" in msg_lower or "cough" in msg_lower:
        response = (
            "For respiratory symptoms and cough: wear a mask in crowded areas, cover your mouth when coughing, "
            "and practice frequent hand washing. If breathing becomes difficult, visit a health center immediately."
        )
    else:
        response = (
            f"Thank you for reaching out. Based on your inquiry regarding '{message}', please ensure good hygiene, "
            f"safe drinking water, and proper sanitation. You can also log any active symptom observations in our 'Submit Report' section to help monitor community health trends."
        )

    # Translate framing for Kannada or Hindi if requested
    if lang == "kn":
        response += "\n(ಸೂಚನೆ: ಮಾಹಿತಿಗಾಗಿ ನೈರ್ಮಲ್ಯ ಮತ್ತು ಆರೋಗ್ಯ ಮುನ್ನೆಚ್ಚರಿಕೆಗಳನ್ನು ಪಾಲಿಸಿ.)"
    elif lang == "hi":
        response += "\n(सूचना: सामान्य स्वास्थ्य सुरक्षा के लिए स्वच्छता का पालन करें।)"

    return response + DISCLAIMER_FOOTER


@router.post("", response_model=ChatMessageOut)
def chat_with_assistant(
    chat_in: ChatMessageCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    user_id = current_user.id if current_user else None

    assistant_reply = generate_assistant_response(chat_in.message, chat_in.language)

    db_chat = ChatHistory(
        user_id=user_id,
        user_message=chat_in.message,
        assistant_response=assistant_reply,
        language=chat_in.language or "en",
        created_at=datetime.utcnow()
    )
    db.add(db_chat)
    db.commit()
    db.refresh(db_chat)

    return ChatMessageOut.from_orm(db_chat)
