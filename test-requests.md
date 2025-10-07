# API Test Requests for AI Chatbot

## Base URL
```
http://localhost:3000
```

## 1. Video Content Ingest

### CURL Command:
```bash
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "type": "video",
    "source_id": "video_001",
    "version": 1,
    "title": "Advanced Basketball Shooting Techniques",
    "description": "Learn professional shooting mechanics and form",
    "to_embedding": {
      "Title": "Advanced Basketball Shooting Techniques",
      "Transcription": "Welcome to this comprehensive guide on basketball shooting. Today we'll cover the fundamentals of proper shooting form, including hand placement, foot positioning, and follow-through. The key to consistent shooting is developing muscle memory through repetition. Start with your feet shoulder-width apart, knees slightly bent, and your shooting hand positioned under the ball. Your guide hand should be on the side for stability. As you prepare to shoot, focus on a smooth upward motion, extending your arm fully and snapping your wrist at the release point. Remember to follow through with your shooting hand pointing toward the basket.",
      "Description": "Learn professional shooting mechanics and form",
      "Purpose": "To teach players the fundamental shooting techniques used by professional basketball players",
      "Setup": "Position yourself 10-15 feet from the basket with a basketball. Ensure you have enough space to practice without obstacles.",
      "CoachingPoints": "1. Keep your elbow in line with the basket. 2. Use your legs to generate power, not just your arms. 3. Follow through with your shooting hand pointing at the target. 4. Maintain consistent form on every shot. 5. Practice from different distances to build confidence.",
      "Adaptations": "For beginners: Start closer to the basket and focus on form over distance. For advanced players: Add movement and game-like scenarios. For players with physical limitations: Adjust shooting angle and use appropriate ball size.",
      "LearningQuestions": "What is the most important aspect of shooting form? How can you ensure consistent follow-through? What role do your legs play in shooting accuracy?"
    },
    "metadata": {
      "duration": "15:30",
      "difficulty": "intermediate",
      "sport": "basketball",
      "age_group": "12-18",
      "equipment": ["basketball", "basket"],
      "tags": ["shooting", "fundamentals", "technique"]
    }
  }'
```

### Postman Collection:
```json
{
  "name": "Video Ingest",
  "request": {
    "method": "POST",
    "header": [
      {
        "key": "Content-Type",
        "value": "application/json"
      }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\n  \"type\": \"video\",\n  \"source_id\": \"video_001\",\n  \"version\": 1,\n  \"title\": \"Advanced Basketball Shooting Techniques\",\n  \"description\": \"Learn professional shooting mechanics and form\",\n  \"to_embedding\": {\n    \"Title\": \"Advanced Basketball Shooting Techniques\",\n    \"Transcription\": \"Welcome to this comprehensive guide on basketball shooting. Today we'll cover the fundamentals of proper shooting form, including hand placement, foot positioning, and follow-through. The key to consistent shooting is developing muscle memory through repetition. Start with your feet shoulder-width apart, knees slightly bent, and your shooting hand positioned under the ball. Your guide hand should be on the side for stability. As you prepare to shoot, focus on a smooth upward motion, extending your arm fully and snapping your wrist at the release point. Remember to follow through with your shooting hand pointing toward the basket.\",\n    \"Description\": \"Learn professional shooting mechanics and form\",\n    \"Purpose\": \"To teach players the fundamental shooting techniques used by professional basketball players\",\n    \"Setup\": \"Position yourself 10-15 feet from the basket with a basketball. Ensure you have enough space to practice without obstacles.\",\n    \"CoachingPoints\": \"1. Keep your elbow in line with the basket. 2. Use your legs to generate power, not just your arms. 3. Follow through with your shooting hand pointing at the target. 4. Maintain consistent form on every shot. 5. Practice from different distances to build confidence.\",\n    \"Adaptations\": \"For beginners: Start closer to the basket and focus on form over distance. For advanced players: Add movement and game-like scenarios. For players with physical limitations: Adjust shooting angle and use appropriate ball size.\",\n    \"LearningQuestions\": \"What is the most important aspect of shooting form? How can you ensure consistent follow-through? What role do your legs play in shooting accuracy?\"\n  },\n  \"metadata\": {\n    \"duration\": \"15:30\",\n    \"difficulty\": \"intermediate\",\n    \"sport\": \"basketball\",\n    \"age_group\": \"12-18\",\n    \"equipment\": [\"basketball\", \"basket\"],\n    \"tags\": [\"shooting\", \"fundamentals\", \"technique\"]\n  }\n}"
    },
    "url": {
      "raw": "http://localhost:3000/ingest",
      "protocol": "http",
      "host": ["localhost"],
      "port": "3000",
      "path": ["ingest"]
    }
  }
}
```

---

## 2. Plan Content Ingest

### CURL Command:
```bash
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "type": "plan",
    "source_id": "plan_001",
    "version": 1,
    "title": "8-Week Basketball Training Program",
    "description": "Comprehensive training plan for developing basketball skills",
    "to_embedding": {
      "Title": "8-Week Basketball Training Program",
      "Description": "Comprehensive training plan for developing basketball skills",
      "Purpose": "To provide a structured approach to basketball skill development over 8 weeks",
      "Setup": "This program requires access to a basketball court, basketball, cones, and resistance bands. Each session should last 60-90 minutes.",
      "CoachingPoints": "Week 1-2: Focus on basic ball handling and shooting form. Week 3-4: Introduce defensive fundamentals and passing. Week 5-6: Develop advanced shooting techniques and footwork. Week 7-8: Integrate all skills in game-like scenarios.",
      "Adaptations": "Beginner: Reduce intensity and focus on fundamentals. Intermediate: Add competitive elements. Advanced: Include position-specific training and game situations.",
      "LearningQuestions": "How do you progress from basic to advanced skills? What is the importance of consistent practice? How do you measure improvement in basketball skills?"
    },
    "metadata": {
      "duration": "8 weeks",
      "sessions_per_week": 3,
      "session_duration": "60-90 minutes",
      "difficulty": "intermediate",
      "sport": "basketball",
      "age_group": "14-18",
      "equipment": ["basketball", "cones", "resistance bands"],
      "tags": ["training", "program", "development", "structured"]
    }
  }'
```

### Postman Collection:
```json
{
  "name": "Plan Ingest",
  "request": {
    "method": "POST",
    "header": [
      {
        "key": "Content-Type",
        "value": "application/json"
      }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\n  \"type\": \"plan\",\n  \"source_id\": \"plan_001\",\n  \"version\": 1,\n  \"title\": \"8-Week Basketball Training Program\",\n  \"description\": \"Comprehensive training plan for developing basketball skills\",\n  \"to_embedding\": {\n    \"Title\": \"8-Week Basketball Training Program\",\n    \"Description\": \"Comprehensive training plan for developing basketball skills\",\n    \"Purpose\": \"To provide a structured approach to basketball skill development over 8 weeks\",\n    \"Setup\": \"This program requires access to a basketball court, basketball, cones, and resistance bands. Each session should last 60-90 minutes.\",\n    \"CoachingPoints\": \"Week 1-2: Focus on basic ball handling and shooting form. Week 3-4: Introduce defensive fundamentals and passing. Week 5-6: Develop advanced shooting techniques and footwork. Week 7-8: Integrate all skills in game-like scenarios.\",\n    \"Adaptations\": \"Beginner: Reduce intensity and focus on fundamentals. Intermediate: Add competitive elements. Advanced: Include position-specific training and game situations.\",\n    \"LearningQuestions\": \"How do you progress from basic to advanced skills? What is the importance of consistent practice? How do you measure improvement in basketball skills?\"\n  },\n  \"metadata\": {\n    \"duration\": \"8 weeks\",\n    \"sessions_per_week\": 3,\n    \"session_duration\": \"60-90 minutes\",\n    \"difficulty\": \"intermediate\",\n    \"sport\": \"basketball\",\n    \"age_group\": \"14-18\",\n    \"equipment\": [\"basketball\", \"cones\", \"resistance bands\"],\n    \"tags\": [\"training\", \"program\", \"development\", \"structured\"]\n  }\n}"
    },
    "url": {
      "raw": "http://localhost:3000/ingest",
      "protocol": "http",
      "host": ["localhost"],
      "port": "3000",
      "path": ["ingest"]
    }
  }
}
```

---

## 3. Coach Info Content Ingest

### CURL Command:
```bash
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "type": "coach_info",
    "source_id": "coach_001",
    "version": 1,
    "title": "Coach Sarah Johnson - Basketball Specialist",
    "description": "Professional basketball coach with 15 years of experience",
    "to_embedding": {
      "Title": "Coach Sarah Johnson - Basketball Specialist",
      "Description": "Professional basketball coach with 15 years of experience",
      "Purpose": "To provide expert basketball coaching and player development services",
      "Setup": "Coach Johnson works with players of all skill levels, from youth to professional. Sessions can be conducted in gyms, outdoor courts, or specialized training facilities.",
      "CoachingPoints": "Specializes in shooting mechanics, ball handling, defensive techniques, and mental game development. Uses video analysis and performance tracking to improve player outcomes. Emphasizes fundamentals while building advanced skills.",
      "Adaptations": "Works with players with physical limitations, learning differences, and various skill levels. Adapts coaching style to individual learning preferences and goals.",
      "LearningQuestions": "What makes a great basketball coach? How do you develop players at different skill levels? What role does mental preparation play in basketball performance?"
    },
    "metadata": {
      "experience_years": 15,
      "specialties": ["shooting", "defense", "mental game", "youth development"],
      "certifications": ["USA Basketball", "NCCP Level 3"],
      "education": "Masters in Sports Psychology",
      "location": "Los Angeles, CA",
      "availability": "Monday-Friday, evenings and weekends",
      "tags": ["coach", "basketball", "professional", "development"]
    }
  }'
```

### Postman Collection:
```json
{
  "name": "Coach Info Ingest",
  "request": {
    "method": "POST",
    "header": [
      {
        "key": "Content-Type",
        "value": "application/json"
      }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\n  \"type\": \"coach_info\",\n  \"source_id\": \"coach_001\",\n  \"version\": 1,\n  \"title\": \"Coach Sarah Johnson - Basketball Specialist\",\n  \"description\": \"Professional basketball coach with 15 years of experience\",\n  \"to_embedding\": {\n    \"Title\": \"Coach Sarah Johnson - Basketball Specialist\",\n    \"Description\": \"Professional basketball coach with 15 years of experience\",\n    \"Purpose\": \"To provide expert basketball coaching and player development services\",\n    \"Setup\": \"Coach Johnson works with players of all skill levels, from youth to professional. Sessions can be conducted in gyms, outdoor courts, or specialized training facilities.\",\n    \"CoachingPoints\": \"Specializes in shooting mechanics, ball handling, defensive techniques, and mental game development. Uses video analysis and performance tracking to improve player outcomes. Emphasizes fundamentals while building advanced skills.\",\n    \"Adaptations\": \"Works with players with physical limitations, learning differences, and various skill levels. Adapts coaching style to individual learning preferences and goals.\",\n    \"LearningQuestions\": \"What makes a great basketball coach? How do you develop players at different skill levels? What role does mental preparation play in basketball performance?\"\n  },\n  \"metadata\": {\n    \"experience_years\": 15,\n    \"specialties\": [\"shooting\", \"defense\", \"mental game\", \"youth development\"],\n    \"certifications\": [\"USA Basketball\", \"NCCP Level 3\"],\n    \"education\": \"Masters in Sports Psychology\",\n    \"location\": \"Los Angeles, CA\",\n    \"availability\": \"Monday-Friday, evenings and weekends\",\n    \"tags\": [\"coach\", \"basketball\", \"professional\", \"development\"]\n  }\n}"
    },
    "url": {
      "raw": "http://localhost:3000/ingest",
      "protocol": "http",
      "host": ["localhost"],
      "port": "3000",
      "path": ["ingest"]
    }
  }
}
```

---

## 4. Search Request

### CURL Command:
```bash
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "basketball shooting techniques",
    "type": "video",
    "filters": {
      "sport": "basketball",
      "difficulty": "intermediate"
    },
    "k": 5,
    "fieldWeights": {
      "Title": 3.0,
      "CoachingPoints": 2.5,
      "Transcription": 1.0
    }
  }'
```

### Postman Collection:
```json
{
  "name": "Search Request",
  "request": {
    "method": "POST",
    "header": [
      {
        "key": "Content-Type",
        "value": "application/json"
      }
    ],
    "body": {
      "mode": "raw",
      "raw": "{\n  \"query\": \"basketball shooting techniques\",\n  \"type\": \"video\",\n  \"filters\": {\n    \"sport\": \"basketball\",\n    \"difficulty\": \"intermediate\"\n  },\n  \"k\": 5,\n  \"fieldWeights\": {\n    \"Title\": 3.0,\n    \"CoachingPoints\": 2.5,\n    \"Transcription\": 1.0\n  }\n}"
    },
    "url": {
      "raw": "http://localhost:3000/search",
      "protocol": "http",
      "host": ["localhost"],
      "port": "3000",
      "path": ["search"]
    }
  }
}
```

---

## 5. Health Check

### CURL Command:
```bash
curl -X GET http://localhost:3000/health
```

### Postman Collection:
```json
{
  "name": "Health Check",
  "request": {
    "method": "GET",
    "url": {
      "raw": "http://localhost:3000/health",
      "protocol": "http",
      "host": ["localhost"],
      "port": "3000",
      "path": ["health"]
    }
  }
}
```

---

## Expected Responses

### Successful Ingest Response:
```json
{
  "ok": true,
  "item_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

### Successful Search Response:
```json
{
  "matches": [
    {
      "item_id": "123e4567-e89b-12d3-a456-426614174000",
      "type": "video",
      "score": 0.85,
      "field": "CoachingPoints",
      "snippet": "1. Keep your elbow in line with the basket. 2. Use your legs to generate power, not just your arms. 3. Follow through with your shooting hand pointing at the target...",
      "metadata": {
        "sport": "basketball",
        "difficulty": "intermediate"
      }
    }
  ]
}
```

### Health Check Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Notes

1. **Base URL**: Make sure your server is running on `http://localhost:3000`
2. **Content-Type**: Always include `Content-Type: application/json` header
3. **Field Weights**: Adjust field weights based on your content importance
4. **Filters**: Use metadata filters to narrow down search results
5. **K Parameter**: Controls the number of results returned (max 100)
6. **Version**: Use version numbers to track content updates
7. **Source ID**: Should be unique per content type and version
