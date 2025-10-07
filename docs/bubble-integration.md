# Bubble Integration Guide

Complete guide for integrating the RAG Service with Bubble applications.

## Overview

This guide provides step-by-step instructions for integrating the RAG Service with your Bubble application, including content ingestion workflows and search functionality.

## Prerequisites

- Bubble account with backend workflows enabled
- RAG Service deployed and accessible
- Content data types in your Bubble app
- Basic understanding of Bubble workflows

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Bubble App                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   Content   │  │   Search    │  │   Results   │           │
│  │   Forms     │  │   Interface  │  │   Display   │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│         │                 │                 │                │
│         ▼                 ▼                 │                │
│  ┌─────────────┐  ┌─────────────┐           │                │
│  │  Backend    │  │  Frontend   │           │                │
│  │ Workflows   │  │ Workflows   │           │                │
│  └─────────────┘  └─────────────┘           │                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RAG Service                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │   Ingest    │  │   Search    │  │   Health    │           │
│  │   API       │  │   API       │  │   API       │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

## Content Ingestion Setup

### Step 1: Create Content Data Types

First, create the necessary data types in your Bubble app:

#### Video Data Type
```
Video
├── unique_id (text)
├── title (text)
├── description (text)
├── transcription (text)
├── purpose (text)
├── setup_instructions (text)
├── coaching_points (text)
├── adaptations (text)
├── learning_questions (text)
├── content (text)
├── category (text)
├── countries (list of text)
├── skill_zone (text)
├── age_groups (list of text)
└── last_ingested (date)
```

#### Plan Data Type
```
Plan
├── unique_id (text)
├── title (text)
├── description (text)
├── purpose (text)
├── setup_instructions (text)
├── coaching_points (text)
├── adaptations (text)
├── learning_questions (text)
├── content (text)
├── category (text)
├── countries (list of text)
├── skill_zone (text)
├── age_groups (list of text)
└── last_ingested (date)
```

#### Coach Data Type
```
Coach
├── unique_id (text)
├── name (text)
├── description (text)
├── bio (text)
├── specialties (list of text)
├── experience_level (text)
├── countries (list of text)
├── certifications (list of text)
└── last_ingested (date)
```

### Step 2: Create Backend Workflows

#### Video Ingestion Workflow

1. **Create Backend Workflow**
   - Name: "Ingest Video Content"
   - Trigger: When a Video is created or updated

2. **Add API Call Action**
   - Method: POST
   - URL: `https://your-rag-service.com/ingest`
   - Headers: `Content-Type: application/json`
   - Body: Use the following JSON structure

```json
{
  "type": "video",
  "source_id": "{{This Video's unique_id}}",
  "version": 1,
  "to_embedding": {
    "Title": "{{This Video's title}}",
    "Transcription": "{{This Video's transcription}}",
    "Description": "{{This Video's description}}",
    "Purpose": "{{This Video's purpose}}",
    "Setup": "{{This Video's setup_instructions}}",
    "CoachingPoints": "{{This Video's coaching_points}}",
    "Adaptations": "{{This Video's adaptations}}",
    "LearningQuestions": "{{This Video's learning_questions}}"
  },
  "metadata": {
    "Content": "{{This Video's content}}",
    "Category": "{{This Video's category}}",
    "Countries": "{{This Video's countries}}",
    "SkillZone": "{{This Video's skill_zone}}",
    "AgeGroups": "{{This Video's age_groups}}",
    "UniqueID": "{{This Video's unique_id}}"
  },
  "title": "{{This Video's title}}",
  "description": "{{This Video's description}}"
}
```

3. **Add Response Handling**
   - Check if response is successful
   - Update `last_ingested` field with current date
   - Log success or error messages

#### Plan Ingestion Workflow

Similar to Video workflow but with `"type": "plan"` and appropriate field mappings.

#### Coach Ingestion Workflow

```json
{
  "type": "coach_info",
  "source_id": "{{This Coach Info's unique_id}}",
  "version": 1,
  "to_embedding": {
    "Title": "{{This Coach Info's title}}",
    "Description": "{{This Coach Info's description}}",
    "Purpose": "{{This Coach Info's bio}}",
    "CoachingPoints": "{{This Coach Info's specialties}}",
    "Adaptations": "{{This Coach Info's experience_level}}"
  },
  "metadata": {
    "Content": "Rugby",
    "Category": "{{This Coach Info's specialties}}",
    "Countries": "{{This Coach Info's countries}}",
    "SkillZone": "{{This Coach Info's experience_level}}",
    "UniqueID": "{{This Coach Info's unique_id}}"
  },
  "title": "{{This Coach Info's title}}",
  "description": "{{This Coach Info's description}}"
}
```

### Step 3: Error Handling

Add error handling to your backend workflows:

1. **Add Conditional Action**
   - Condition: API call response is not successful
   - Action: Log error message
   - Action: Send notification to admin (optional)

2. **Add Success Action**
   - Condition: API call response is successful
   - Action: Update `last_ingested` field
   - Action: Log success message

## Search Implementation

### Step 1: Create Search Interface

#### Search Form Elements
- **Search Input**: Text input for search query
- **Type Selector**: Dropdown for content type (All, Video, Plan, Coach Info)
- **Category Filter**: Dropdown for category filtering
- **Country Filter**: Multi-select for country filtering
- **Skill Zone Filter**: Dropdown for skill level filtering
- **Search Button**: Button to trigger search

#### Search Results Display
- **Results List**: Repeating group to display search results
- **Result Card**: Individual result display with:
  - Title/Name
  - Type badge
  - Relevance score
  - Snippet preview
  - Metadata tags

### Step 2: Create Search Workflow

#### Frontend Search Workflow

1. **Create Frontend Workflow**
   - Name: "Search Content"
   - Trigger: When search button is clicked

2. **Add API Call Action**
   - Method: POST
   - URL: `https://your-rag-service.com/search`
   - Headers: `Content-Type: application/json`
   - Body: Dynamic JSON based on form inputs

```json
{
  "query": "{{Search_Input's value}}",
  "type": "{{Type_Selector's value}}",
  "filters": {
    "Category": "{{Category_Filter's value}}",
    "Countries": "{{Country_Filter's value}}",
    "SkillZone": "{{Skill_Zone_Filter's value}}"
  },
  "k": 10
}
```

3. **Add Response Processing**
   - Parse search results
   - Update results list
   - Handle empty results
   - Display error messages if needed

### Step 3: Result Display Setup

#### Search Result Data Type
```
SearchResult
├── item_id (text)
├── type (text)
├── score (number)
├── field (text)
├── snippet (text)
├── metadata (text)
└── display_title (text)
```

#### Results Processing
1. **Create Custom State**
   - Name: `search_results`
   - Type: List of SearchResult

2. **Process API Response**
   - Map each match to SearchResult
   - Set display_title based on type
   - Format metadata for display
   - Sort by score (highest first)

3. **Display Results**
   - Use repeating group with search_results
   - Show relevance score as percentage
   - Display type-specific icons
   - Show metadata as tags

## Advanced Features

### Batch Ingestion

For bulk content ingestion:

1. **Create Backend Workflow**
   - Name: "Batch Ingest Content"
   - Trigger: Manual or scheduled

2. **Add Loop Action**
   - Loop through all content items
   - Check if `last_ingested` is older than content update
   - Call individual ingestion workflows

### Search Analytics

Track search usage:

1. **Create Search Log Data Type**
   ```
   SearchLog
   ├── query (text)
   ├── filters (text)
   ├── result_count (number)
   ├── user (user)
   └── timestamp (date)
   ```

2. **Log Search Actions**
   - Create SearchLog record after each search
   - Track popular queries
   - Monitor search performance

### Content Management

#### Ingestion Status Dashboard
- Show content items with ingestion status
- Display last ingested timestamps
- Provide manual re-ingestion buttons
- Show ingestion errors

#### Content Preview
- Preview content before ingestion
- Show field mappings
- Validate required fields
- Test search functionality

## Troubleshooting

### Common Issues

#### 1. Ingestion Failures
- **Check API URL**: Ensure correct RAG service URL
- **Verify Data**: Check that all required fields are populated
- **Test Connection**: Use health check endpoint
- **Review Logs**: Check Bubble backend workflow logs

#### 2. Search Not Working
- **Verify Content**: Ensure content has been ingested
- **Check Filters**: Verify filter values match metadata
- **Test Query**: Try simple queries first
- **Review Response**: Check API response format

#### 3. Performance Issues
- **Batch Size**: Limit concurrent API calls
- **Caching**: Implement result caching
- **Pagination**: Use pagination for large result sets
- **Loading States**: Show loading indicators

### Debug Workflows

#### Test Ingestion
1. Create test content item
2. Trigger ingestion workflow
3. Check RAG service logs
4. Verify content appears in search

#### Test Search
1. Use simple search query
2. Check API response
3. Verify result formatting
4. Test with different filters

## Best Practices

### Content Organization
- **Consistent Naming**: Use consistent field names across content types
- **Required Fields**: Ensure all required fields are populated
- **Data Quality**: Regular data validation and cleanup
- **Version Control**: Track content changes and versions

### Performance Optimization
- **Lazy Loading**: Load search results progressively
- **Caching**: Cache frequent searches
- **Debouncing**: Debounce search input
- **Pagination**: Implement result pagination

### User Experience
- **Loading States**: Show loading indicators during API calls
- **Error Messages**: Provide clear error messages
- **Empty States**: Handle empty search results gracefully
- **Search Suggestions**: Implement search suggestions

### Security
- **API Keys**: Never expose service keys in frontend
- **Input Validation**: Validate all user inputs
- **Rate Limiting**: Implement client-side rate limiting
- **Error Handling**: Don't expose sensitive error details

## Monitoring and Maintenance

### Health Monitoring
- **Service Health**: Regular health checks
- **Content Sync**: Monitor ingestion success rates
- **Search Performance**: Track search response times
- **Error Rates**: Monitor API error rates

### Content Maintenance
- **Regular Sync**: Schedule regular content synchronization
- **Data Cleanup**: Remove outdated content
- **Index Maintenance**: Monitor search index health
- **Performance Tuning**: Optimize based on usage patterns

### User Feedback
- **Search Analytics**: Track search patterns
- **User Feedback**: Collect user feedback on search results
- **A/B Testing**: Test different search configurations
- **Continuous Improvement**: Iterate based on usage data

## Support and Resources

### Documentation
- [RAG Service API Reference](../api-reference.md)
- [Architecture Guide](../architecture.md)
- [Deployment Guide](../deployment.md)

### Community
- Bubble Community Forum
- RAG Service GitHub Issues
- Technical Support Channels

### Updates
- Monitor RAG service updates
- Test new features in development
- Plan migration strategies
- Communicate changes to users


